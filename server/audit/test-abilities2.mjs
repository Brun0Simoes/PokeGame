import * as core from '../../js/battle-core.js';

console.log('=== Intimidate switch-in: -1 ATK foe ===');
const intim = { abilities:['intimidate'], name:'I' };
const foe = { name:'F', _stages:{}, abilities:[] };
core.abilitySwitchIn(intim, foe);
console.log('foe ATK stage:', foe._stages.attack, '(esperado -1)');

console.log('\n=== Speed Boost end-of-turn: +1 SPE ===');
const sb = { abilities:['speed-boost'], _stages:{}, name:'S' };
const ev = core.abilityEndOfTurn(sb);
console.log('SPE stage:', sb._stages.speed, '(esperado 1)');
console.log('message:', ev[0]?.message);

console.log('\n=== Speed Boost para em +6 ===');
const sb2 = { abilities:['speed-boost'], _stages:{speed:6}, name:'S' };
core.abilityEndOfTurn(sb2);
console.log('SPE stage capped:', sb2._stages.speed, '(esperado 6)');

console.log('\n=== Moxie on KO: +1 ATK ===');
const moxie = { abilities:['moxie'], _stages:{}, name:'M' };
const ko = core.abilityOnKO(moxie);
console.log('ATK stage:', moxie._stages.attack, '(esperado 1)');
console.log('message:', ko[0]?.message);

console.log('\n=== Regenerator on switch-out: +33% HP ===');
const reg = { abilities:['regenerator'], hp:50, maxHp:100 };
core.abilityOnSwitchOut(reg);
console.log('hp:', reg.hp, '(esperado 83 - 50 + floor(100/3) = 83)');

console.log('\n=== Natural Cure on switch-out: limpa status ===');
const nc = { abilities:['natural-cure'], hp:50, maxHp:100, status:'poisoned' };
core.abilityOnSwitchOut(nc);
console.log('status:', nc.status, '(esperado none)');

console.log('\n=== Rough Skin contact: 1/8 maxHp atacante ===');
const rs = { abilities:['rough-skin'] };
const att = { hp:100, maxHp:100, name:'A' };
const move = { damage_class:'physical', name:'tackle' };
const evs = core.abilityContact(rs, att, move);
console.log('atacante hp:', att.hp, '(esperado 88, 100 - 100/8)');
console.log('message:', evs[0]?.message);

console.log('\n=== Status immunity abilities ===');
console.log('immunity vs poison:', core.abilityStatusImmune({abilities:['immunity']}, 'poisoned'), '(esperado true)');
console.log('limber vs paralysis:', core.abilityStatusImmune({abilities:['limber']}, 'paralyzed'), '(esperado true)');
console.log('insomnia vs sleep:', core.abilityStatusImmune({abilities:['insomnia']}, 'asleep'), '(esperado true)');
console.log('water-veil vs burn:', core.abilityStatusImmune({abilities:['water-veil']}, 'burned'), '(esperado true)');
