import * as core from '../../js/battle-core.js';

console.log('=== Test: paralisia ÷2 speed ===');
const m1 = { stats:{speed:200}, status:'paralyzed', _stages:{} };
const m2 = { stats:{speed:200}, status:'none', _stages:{} };
console.log('paralyzed speed:', core.effStat(m1,'speed'), '(esperado 100)');
console.log('healthy   speed:', core.effStat(m2,'speed'), '(esperado 200)');
console.log('PASS:', core.effStat(m1,'speed')===100 && core.effStat(m2,'speed')===200);

console.log('\n=== Test: burn ÷2 attack ===');
const b = { stats:{attack:200}, status:'burned', _stages:{} };
console.log('burned attack:', core.effStat(b,'attack'), '(esperado 100)');

console.log('\n=== Test: stage +2 = ×2 ===');
const s = { stats:{attack:100}, status:'none', _stages:{attack:2} };
console.log('stage+2 attack:', core.effStat(s,'attack'), '(esperado 200)');

console.log('\n=== Test: stage -6 = ×0.25 ===');
const s2 = { stats:{attack:100}, status:'none', _stages:{attack:-6} };
console.log('stage-6 attack:', core.effStat(s2,'attack'), '(esperado 25)');

console.log('\n=== Test: priority order ===');
const tests = [
  ['quick-attack', 1],
  ['extreme-speed', 2],
  ['fake-out', 3],
  ['protect', 4],
  ['tackle', 0],
];
for (const [name, exp] of tests) {
  const got = core.movePriority({ name, priority: undefined });
  console.log(`${name}: ${got} (esperado ${exp})`, got===exp?'OK':'FAIL');
}

console.log('\n=== Test: end-of-turn poison/burn formula ===');
const psn = { hp:80, maxHp:80, status:'poisoned', name:'X' };
core.endOfTurnStatus(psn);
console.log('poisoned 80hp → hp=', psn.hp, '(esperado 70, ou seja maxHp/8=10)');
const brn = { hp:80, maxHp:80, status:'burned', name:'X' };
core.endOfTurnStatus(brn);
console.log('burned 80hp → hp=', brn.hp, '(esperado 75, ou seja maxHp/16=5)');

console.log('\n=== Test: status immunity by type ===');
console.log('fire vs burn:', core.applyStatus({types:['fire'],status:'none'}, 'burned').ok, '(esperado false)');
console.log('elec vs paralyze:', core.applyStatus({types:['electric'],status:'none'}, 'paralyzed').ok, '(esperado false)');
console.log('ice vs freeze:', core.applyStatus({types:['ice'],status:'none'}, 'frozen').ok, '(esperado false)');
console.log('poison vs poison:', core.applyStatus({types:['poison'],status:'none'}, 'poisoned').ok, '(esperado false)');
console.log('steel vs poison:', core.applyStatus({types:['steel'],status:'none'}, 'poisoned').ok, '(esperado false)');
console.log('normal vs burn:', core.applyStatus({types:['normal'],status:'none'}, 'burned').ok, '(esperado true)');
