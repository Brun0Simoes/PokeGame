import * as core from '../../js/battle-core.js';

console.log('=== Fresh side state ===');
console.log(core.freshSide());

console.log('\n=== Screen mults ===');
const phys = { damage_class:'physical' };
const spec = { damage_class:'special' };
const refl = { reflect:3, lightscreen:0, auroraveil:0 };
const ls = { reflect:0, lightscreen:3, auroraveil:0 };
const av = { reflect:0, lightscreen:0, auroraveil:3 };
console.log('reflect+phys:', core.screenMult(refl, phys), '(esperado 0.5)');
console.log('reflect+spec:', core.screenMult(refl, spec), '(esperado 1)');
console.log('lightscr+spec:', core.screenMult(ls, spec), '(esperado 0.5)');
console.log('aurora+phys:', core.screenMult(av, phys), '(esperado 0.5)');
console.log('aurora+spec:', core.screenMult(av, spec), '(esperado 0.5)');

console.log('\n=== Hazard on entry: stealth rock damage ===');
const side = { stealthrock:true, spikes:0, toxicspikes:0 };
const mon1 = { types:['fire','flying'], maxHp:100, name:'Char' }; // 4x weak to rock
const r1 = core.hazardOnEntry(side, mon1);
console.log('Charizard hp%:', r1[0]?.dmg, '/100 (esperado 50, ou seja 1/8 * 4)');

const mon2 = { types:['water'], maxHp:100, name:'Water' }; // resist 0.5x
const r2 = core.hazardOnEntry(side, mon2);
console.log('Water hp%:', r2[0]?.dmg, '/100 (esperado 6, ou seja 1/8 * 0.5)');

console.log('\n=== Spikes layered damage ===');
const sp1 = { stealthrock:false, spikes:1, toxicspikes:0 };
const sp2 = { stealthrock:false, spikes:2, toxicspikes:0 };
const sp3 = { stealthrock:false, spikes:3, toxicspikes:0 };
const grounded = { types:['normal'], maxHp:200, name:'X' };
console.log('1 layer:', core.hazardOnEntry(sp1, grounded)[0]?.dmg, '(esperado 25, 1/8)');
console.log('2 layer:', core.hazardOnEntry(sp2, grounded)[0]?.dmg, '(esperado 33, 1/6)');
console.log('3 layer:', core.hazardOnEntry(sp3, grounded)[0]?.dmg, '(esperado 50, 1/4)');

console.log('\n=== Spikes nao afeta flying ===');
const flying = { types:['flying'], maxHp:100, name:'F' };
console.log('flying vs spikes:', core.hazardOnEntry(sp3, flying), '(esperado vazio)');

console.log('\n=== Toxic spikes ===');
const tsp = { stealthrock:false, spikes:0, toxicspikes:1 };
console.log('grounded vs t-spikes:', core.hazardOnEntry(tsp, grounded), '(esperado status=poisoned)');
const poisonType = { types:['poison'], maxHp:100, name:'P' };
console.log('poison vs t-spikes:', core.hazardOnEntry(tsp, poisonType), '(esperado vazio — poison absorve)');
