// reimplementa a formula exata do battle.js _damage para testar isoladamente
import * as core from '../../js/battle-core.js';
import { typeMultiplier } from '../../js/data.js';

function damage(attacker, defender, move, basePower, crit, rng = Math.random) {
  const lvl = attacker.level;
  const special = move.damage_class === 'special';
  let atk = core.effStat(attacker, special ? 'special-attack' : 'attack');
  let def = core.effStat(defender, special ? 'special-defense' : 'defense');
  if (crit) {
    atk = Math.max(atk, attacker.stats[special?'special-attack':'attack']);
    def = Math.min(def, defender.stats[special?'special-defense':'defense']);
  }
  let dmg = (((2*lvl/5 + 2) * basePower * (atk/def)) / 50) + 2;
  if ((attacker.types||[]).includes(move.type)) dmg *= 1.5;
  dmg *= typeMultiplier(move.type, defender.types);
  if (crit) dmg *= 1.5;
  dmg *= 0.85 + rng()*0.15;
  return Math.max(1, Math.floor(dmg));
}

// Cenario: lvl 50 Charizard (atk 84) usa Tackle (40 BP normal) em Rattata (def 35)
// Charizard fire/flying, Tackle normal -> sem STAB, sem eff (normal->normal=1)
const att = { level:50, stats:{attack:84}, status:'none', _stages:{}, types:['fire','flying'] };
const def = { stats:{defense:35}, status:'none', _stages:{}, types:['normal'] };
const tackle = { name:'tackle', type:'normal', power:40, damage_class:'physical' };

console.log('=== Tackle Charizard vs Rattata, no crit, no random ===');
let total = 0, hits = 1000;
for (let i=0;i<hits;i++) total += damage(att, def, tackle, 40, false);
console.log('mean dmg:', (total/hits).toFixed(2));
// formula: ((2*50/5+2)*40*(84/35))/50 + 2 = (22*40*2.4)/50 + 2 = 42.24 + 2 = 44.24
// no STAB, no eff -> *1 -> *0.925avg (random 0.85-1.0) = ~40.92
console.log('esperado (gen5+ aprox):', (44.24 * 0.925).toFixed(2), '(40-44 range)');

console.log('\n=== STAB check: Flamethrower (BP90, fire) vs same target ===');
const flam = { name:'flamethrower', type:'fire', power:90, damage_class:'special' };
const att2 = { ...att, stats:{...att.stats, 'special-attack':109} };
const def2 = { ...def, stats:{...def.stats, 'special-defense':35} };
const sample = damage(att2, def2, flam, 90, false, () => 0.5); // fix random
// ((2*50/5+2)*90*(109/35))/50+2 = (22*90*3.114)/50+2 = 123.31+2 = 125.31
// STAB 1.5 = 187.97
// normal eff vs normal = 1.0
// random 0.925 = 173.87
console.log('com STAB+random 0.925:', sample, '(esperado ~173)');

console.log('\n=== Super effective: Water Gun vs Charizard (fire/flying) ===');
const wat = { name:'water-gun', type:'water', power:40, damage_class:'special' };
const att3 = { level:50, stats:{ 'special-attack':50, attack:50 }, status:'none', _stages:{}, types:['water'] };
const def3 = { level:50, stats:{ 'special-defense':50, defense:50 }, status:'none', _stages:{}, types:['fire','flying'] };
const sample3 = damage(att3, def3, wat, 40, false, () => 0.5);
// ((2*50/5+2)*40*1)/50+2 = 19.6
// STAB 1.5 = 29.4
// eff water vs fire = 2, vs flying = 1, combined = 2
// = 58.8
// random 0.925 = 54.39
console.log('com STAB+2× eff+random 0.925:', sample3, '(esperado ~54)');

console.log('\n=== Crit ignora -ATK do atacante e +DEF do defensor ===');
const lowAtk = { level:50, stats:{attack:200}, status:'none', _stages:{attack:-4}, types:['normal'] };
const highDef = { level:50, stats:{defense:50}, status:'none', _stages:{defense:4}, types:['normal'] };
// sem crit: atk efetivo = 200*0.33=66, def efetivo = 50*3=150
// com crit: atk = max(66, 200) = 200, def = min(150, 50) = 50
const noCrit = damage(lowAtk, highDef, tackle, 40, false, () => 0.5);
const yesCrit = damage(lowAtk, highDef, tackle, 40, true, () => 0.5);
console.log('sem crit:', noCrit);
console.log('com crit:', yesCrit);
console.log('crit deve ser MUITO maior (>= ~5×):', yesCrit/noCrit > 5 ? 'OK' : 'FAIL');

console.log('\n=== Random damage variance check ===');
let mn=999, mx=0;
for (let i=0;i<5000;i++) {
  const d = damage(att, def, tackle, 40, false);
  if (d<mn) mn=d; if (d>mx) mx=d;
}
console.log(`range observado: ${mn}..${mx} (esperado: ~85% a 100% do max teorico)`);
const expectedMax = Math.floor(44.24);
const expectedMin = Math.floor(44.24 * 0.85);
console.log(`range esperado:  ${expectedMin}..${expectedMax}`);
