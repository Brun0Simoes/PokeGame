import * as core from '../../js/battle-core.js';
import { ITEMS } from '../../js/data.js';

// Replica os checks do battle.js para 25 items

function damageMod(attacker, defender, move, baseDmg, eff = 1) {
  let dmg = baseDmg;
  const hd = attacker._heldData;
  if(hd){
    if(hd.effect==='lifeorb') dmg = Math.floor(dmg * 1.3);
    if(hd.effect==='expertbelt' && eff > 1) dmg = Math.floor(dmg * 1.2);
    if(hd.effect==='physboost' && move.damage_class==='physical') dmg = Math.floor(dmg * (hd.mult||1.1));
    if(hd.effect==='specboost' && move.damage_class==='special') dmg = Math.floor(dmg * (hd.mult||1.1));
    if(hd.effect==='typeboost' && hd.boostType === move.type) dmg = Math.floor(dmg * (hd.mult||1.2));
    if(hd.effect==='gem' && hd.gemType === move.type && !attacker._gemUsed){
      dmg = Math.floor(dmg * (hd.mult||1.3));
      attacker._gemUsed = true;
    }
    if(hd.effect==='metronome'){
      if(attacker._lastMove === move.name){
        attacker._metroStacks = Math.min(5, (attacker._metroStacks||0) + 1);
      } else attacker._metroStacks = 0;
      const mult = 1 + 0.2 * attacker._metroStacks;
      if(mult > 1) dmg = Math.floor(dmg * mult);
    }
  }
  if(defender._heldData?.effect==='eviolite' && defender._canStillEvolve){
    dmg = Math.floor(dmg / 1.5);
  }
  return dmg;
}

const move = { type:'fire', damage_class:'special', name:'flamethrower', power:90 };
const baseDmg = 100;

console.log('=== Type-boost (Charcoal +20% fire) ===');
const att1 = { _heldData: ITEMS['charcoal'].held };
const def = {};
console.log('com charcoal:', damageMod(att1, def, move, baseDmg), '(esperado 120)');

console.log('\n=== Wise Glasses +10% special ===');
const att2 = { _heldData: ITEMS['wise-glasses'].held };
console.log('com wise-glasses:', damageMod(att2, def, move, baseDmg), '(esperado 110)');

console.log('\n=== Muscle Band +10% physical ===');
const tackle = { type:'normal', damage_class:'physical', name:'tackle', power:40 };
const att3 = { _heldData: ITEMS['muscle-band'].held };
console.log('com muscle-band (phys):', damageMod(att3, def, tackle, baseDmg), '(esperado 110)');
console.log('com muscle-band (spec):', damageMod(att3, def, move, baseDmg), '(esperado 100 — não afeta)');

console.log('\n=== Fire Gem (one-shot) ===');
const att4 = { _heldData: ITEMS['type-gem-fire'].held };
const d1 = damageMod(att4, def, move, baseDmg);
const d2 = damageMod(att4, def, move, baseDmg);
console.log('1ª usada:', d1, '(esperado 130)');
console.log('2ª usada:', d2, '(esperado 100 — gem consumida)');

console.log('\n=== Metronome stacking (mesmo move 3×) ===');
const att5 = { _heldData: ITEMS['metronome-item'].held };
const r1 = damageMod(att5, def, move, baseDmg);
const r2 = damageMod(att5, def, move, baseDmg);
const r3 = damageMod(att5, def, move, baseDmg);
console.log('1ª (sem stacks):', r1, '(esperado 100)');
console.log('2ª (+20%):', r2, '(esperado 120)');
console.log('3ª (+40%):', r3, '(esperado 140)');

console.log('\n=== Eviolite (defender) ===');
const att6 = {};
const defEv = { _heldData: ITEMS['eviolite'].held, _canStillEvolve: true };
const defEv2 = { _heldData: ITEMS['eviolite'].held, _canStillEvolve: false };
console.log('Eviolite + evolui:', damageMod(att6, defEv, move, 150), '(esperado 100 — /1.5)');
console.log('Eviolite + nao evolui:', damageMod(att6, defEv2, move, 150), '(esperado 150 — sem efeito)');

console.log('\n=== Expert Belt em SE ===');
const att7 = { _heldData: ITEMS['expert-belt'].held };
console.log('expert+SE 2x:', damageMod(att7, def, move, 100, 2), '(esperado 120)');
console.log('expert+neutral:', damageMod(att7, def, move, 100, 1), '(esperado 100)');

console.log('\n=== Life Orb ===');
const att8 = { _heldData: ITEMS['life-orb'].held };
console.log('life-orb:', damageMod(att8, def, move, 100), '(esperado 130)');

console.log('\n=== Crit boost (Scope Lens / Lansat) ===');
function critStage(att) {
  let s = 0;
  if(att._heldData?.effect==='critstage') s += 1;
  if(att._heldData?.effect==='critup' && att.hp <= att.maxHp/4) s += 2;
  return s;
}
console.log('Scope Lens:', critStage({_heldData: ITEMS['scope-lens'].held}), '(esperado 1)');
console.log('Lansat low HP:', critStage({_heldData: ITEMS['lansat-berry'].held, hp:10, maxHp:100}), '(esperado 2)');
console.log('Lansat full HP:', critStage({_heldData: ITEMS['lansat-berry'].held, hp:100, maxHp:100}), '(esperado 0)');

console.log('\n=== Accuracy mods ===');
function accMod(att, def, move) {
  let acc = move.accuracy;
  if(att._heldData?.effect==='accuracy') acc *= att._heldData.mult || 1.1;
  if(def._heldData?.effect==='evasion') acc *= 1 / (def._heldData.mult || 1.1);
  return acc;
}
console.log('Wide Lens BP 80:', accMod({_heldData: ITEMS['wide-lens'].held}, {}, {accuracy:80}), '(esperado 88)');
console.log('Bright Powder BP 100:', accMod({}, {_heldData: ITEMS['bright-powder'].held}, {accuracy:100}), '(esperado ~91)');
