import * as core from '../../js/battle-core.js';
import { typeMultiplier } from '../../js/data.js';

function pickAIMove(aiMon, targetMon, moves) {
  moves = moves.filter(m=>m.pp>0);
  if(moves.length === 0) return null;
  const scoreMove = (m) => {
    const power = m.power || 0;
    const eff = typeMultiplier(m.type, targetMon.types);
    if (eff === 0) return -1;
    const absorb = core.abilityAbsorb(targetMon, m);
    if (absorb?.immune) return -1;
    const acc = (m.accuracy ?? 100) / 100;
    const stab = (aiMon.types || []).includes(m.type) ? 1.5 : 1;
    if (power === 0) {
      const hpRatio = aiMon.hp / aiMon.maxHp;
      if (/recover|roost|rest/.test(m.name) && hpRatio < 0.5) return 80;
      if (m.meta?.ailment && m.meta.ailment !== 'none' && (!targetMon.status || targetMon.status === 'none')) return 40;
      return 20;
    }
    return power * eff * acc * stab;
  };
  const scored = moves.map(m=>({m, s: scoreMove(m)})).sort((a,b)=>b.s-a.s);
  if (scored[0].s < 0) return moves[Math.floor(Math.random()*moves.length)];
  return scored[0].m;
}

console.log('=== Hydro Pump (110/80) vs Surf (90/100) — AI prefere maior EV? ===');
let ai = { types:['water'], hp:100, maxHp:100 };
let target = { name:'T', types:['fire'], abilities:[] };
let moves = [
  { name:'hydro-pump', type:'water', power:110, accuracy:80, pp:5, damage_class:'special' },
  { name:'surf',       type:'water', power:90,  accuracy:100, pp:15, damage_class:'special' },
];
// Hydro Pump score: 110*2*0.8*1.5 = 264
// Surf score:       90*2*1.0*1.5 = 270 ← maior!
const r1 = pickAIMove(ai, target, moves);
console.log('AI escolheu:', r1.name, '(Surf esperado — Hydro 264 vs Surf 270)');
console.log('PASS:', r1.name === 'surf' ? 'OK' : 'FAIL');

console.log('\n=== Levitate: AI evita ground move ===');
target = { name:'T', types:['rock','ground'], abilities:['levitate'] };  // canonicamente nao existe, mas para teste
moves = [
  { name:'earthquake', type:'ground', power:100, accuracy:100, pp:10, damage_class:'physical' },
  { name:'flamethrower', type:'fire', power:90, accuracy:100, pp:15, damage_class:'special' },
];
const r2 = pickAIMove(ai, target, moves);
console.log('AI escolheu:', r2.name, '(esperado flamethrower — earthquake é imune via levitate)');
console.log('PASS:', r2.name === 'flamethrower' ? 'OK' : 'FAIL');

console.log('\n=== Flash Fire: AI evita fire vs flash-fire ===');
target = { name:'T', types:['rock'], abilities:['flash-fire'] };
moves = [
  { name:'flamethrower', type:'fire', power:90, accuracy:100, pp:15, damage_class:'special' },
  { name:'tackle', type:'normal', power:40, accuracy:100, pp:35, damage_class:'physical' },
];
const r3 = pickAIMove(ai, target, moves);
console.log('AI escolheu:', r3.name, '(esperado tackle — flash-fire absorve flamethrower)');
console.log('PASS:', r3.name === 'tackle' ? 'OK' : 'FAIL');

console.log('\n=== Recover quando HP baixo ===');
ai = { types:['water'], hp:30, maxHp:100 };
target = { name:'T', types:['fire'], abilities:[] };
moves = [
  { name:'recover', type:'normal', power:0, pp:10, damage_class:'status' },
  { name:'tackle', type:'normal', power:40, accuracy:100, pp:35, damage_class:'physical' },
];
// recover score: 80 (low HP)
// tackle score:  40*1*1*1 = 40
const r4 = pickAIMove(ai, target, moves);
console.log('AI escolheu:', r4.name, '(esperado recover — HP baixo)');
console.log('PASS:', r4.name === 'recover' ? 'OK' : 'FAIL');

console.log('\n=== Recover quando HP alto: prefere tackle ===');
ai = { types:['water'], hp:90, maxHp:100 };
const r5 = pickAIMove(ai, target, moves);
console.log('AI escolheu:', r5.name, '(esperado tackle — HP alto)');
console.log('PASS:', r5.name === 'tackle' ? 'OK' : 'FAIL');

console.log('\n=== AI considera STAB ===');
ai = { types:['fire'], hp:100, maxHp:100 };
target = { name:'T', types:['normal'], abilities:[] };
moves = [
  { name:'flamethrower', type:'fire', power:90, accuracy:100, pp:15, damage_class:'special' }, // STAB: 90*1*1*1.5=135
  { name:'water-gun', type:'water', power:90, accuracy:100, pp:25, damage_class:'special' },   // 90*1*1=90
];
const r6 = pickAIMove(ai, target, moves);
console.log('AI escolheu:', r6.name, '(esperado flamethrower — STAB)');
console.log('PASS:', r6.name === 'flamethrower' ? 'OK' : 'FAIL');

console.log('\n=== Only PP-spent move: pega randomicamente ===');
ai = { types:['water'], hp:50, maxHp:100 };
target = { name:'T', types:['fire'], abilities:['water-absorb'] };
moves = [
  { name:'surf', type:'water', power:90, accuracy:100, pp:5, damage_class:'special' },
];
const r7 = pickAIMove(ai, target, moves);
console.log('AI escolheu:', r7?.name, '(unico move imune mas eh o que tem)');
