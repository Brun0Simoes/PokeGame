import * as core from '../../js/battle-core.js';

console.log('=== Pinch boosts: 1.5x quando HP <= 1/3 ===');
const blz = { abilities:['blaze'], hp:30, maxHp:100, types:['fire'] };
const move = { type:'fire', damage_class:'special' };
console.log('blaze@30%:', core.abilityAtkMult(blz, move), '(esperado 1.5)');
const blz2 = { abilities:['blaze'], hp:50, maxHp:100, types:['fire'] };
console.log('blaze@50%:', core.abilityAtkMult(blz2, move), '(esperado 1)');
const blz3 = { abilities:['blaze'], hp:30, maxHp:100, types:['fire'] };
console.log('blaze@30% mas tipo water:', core.abilityAtkMult(blz3, {type:'water', damage_class:'special'}), '(esperado 1)');

console.log('\n=== Huge Power: ×1.5 physical (canonical 2×) ===');
const hp = { abilities:['huge-power'], hp:100, maxHp:100, types:[] };
console.log('huge-power phys:', core.abilityAtkMult(hp, {type:'normal', damage_class:'physical'}), '(esperado 1.5 — canonical é 2.0)');
console.log('huge-power spec:', core.abilityAtkMult(hp, {type:'normal', damage_class:'special'}), '(esperado 1)');

console.log('\n=== Guts: ×1.5 physical com status ===');
const guts = { abilities:['guts'], hp:50, maxHp:100, status:'burned', types:[] };
console.log('guts+burn phys:', core.abilityAtkMult(guts, {type:'normal', damage_class:'physical'}), '(esperado 1.5)');
const gutsHealth = { abilities:['guts'], hp:50, maxHp:100, status:'none', types:[] };
console.log('guts healthy phys:', core.abilityAtkMult(gutsHealth, {type:'normal', damage_class:'physical'}), '(esperado 1)');

console.log('\n=== Thick Fat: 0.5x fire/ice ===');
const tf = { abilities:['thick-fat'] };
console.log('thick-fat vs fire:', core.abilityDefMult(tf, {type:'fire'}), '(esperado 0.5)');
console.log('thick-fat vs ice:', core.abilityDefMult(tf, {type:'ice'}), '(esperado 0.5)');
console.log('thick-fat vs water:', core.abilityDefMult(tf, {type:'water'}), '(esperado 1)');

console.log('\n=== Sturdy: sobrevive OHKO ===');
const st = { abilities:['sturdy'], hp:100, maxHp:100 };
console.log('full hp OHKO:', core.abilitySturdy(st, 150), '(esperado true)');
const stHurt = { abilities:['sturdy'], hp:80, maxHp:100 };
console.log('80% OHKO:', core.abilitySturdy(stHurt, 150), '(esperado false)');

console.log('\n=== Levitate: imune ground ===');
const lev = { abilities:['levitate'], name:'L' };
const groundMove = { type:'ground', name:'earthquake' };
const r = core.abilityAbsorb(lev, groundMove);
console.log('levitate vs ground:', r);

console.log('\n=== Flash Fire / Water Absorb / Volt Absorb ===');
console.log('flash-fire vs fire:', core.abilityAbsorb({abilities:['flash-fire'],name:'X'}, {type:'fire'}));
console.log('water-absorb vs water:', core.abilityAbsorb({abilities:['water-absorb'],name:'X'}, {type:'water'}));
console.log('volt-absorb vs electric:', core.abilityAbsorb({abilities:['volt-absorb'],name:'X'}, {type:'electric'}));

console.log('\n=== Technician: ×1.5 em moves <= 60 BP ===');
const tech = { abilities:['technician'] };
console.log('tech BP60:', core.abilityAtkMultExtra(tech, {power:60,type:'normal',damage_class:'physical'}, 1), '(esperado 1.5)');
console.log('tech BP61:', core.abilityAtkMultExtra(tech, {power:61,type:'normal',damage_class:'physical'}, 1), '(esperado 1)');
console.log('tech BP40:', core.abilityAtkMultExtra(tech, {power:40,type:'normal',damage_class:'physical'}, 1), '(esperado 1.5)');

console.log('\n=== Tinted Lens: ×2 em moves resistidos ===');
const tin = { abilities:['tinted-lens'] };
console.log('tinted vs 0.5x:', core.abilityAtkMultExtra(tin, {power:100,type:'normal',damage_class:'physical'}, 0.5), '(esperado 2)');
console.log('tinted vs 1x:', core.abilityAtkMultExtra(tin, {power:100,type:'normal',damage_class:'physical'}, 1), '(esperado 1)');

console.log('\n=== Adaptability: STAB ×2 ===');
const ad = { abilities:['adaptability'], types:['water'] };
console.log('adapt + STAB:', core.abilityAtkMultExtra(ad, {power:100,type:'water',damage_class:'special'}, 1), '(esperado 1.33 → combinado com STAB 1.5 = 2.0)');
console.log('adapt sem STAB:', core.abilityAtkMultExtra(ad, {power:100,type:'fire',damage_class:'special'}, 1), '(esperado 1)');
