import * as core from '../../js/battle-core.js';

console.log('=== Weather damage multipliers ===');
const tests = [
  ['rain', 'water', 1.5], ['rain', 'fire', 0.5],
  ['sun', 'fire', 1.5], ['sun', 'water', 0.5],
  ['sandstorm', 'rock', 1], ['hail', 'ice', 1],
  ['none', 'fire', 1], ['rain', 'electric', 1],
];
for (const [w, t, exp] of tests) {
  const got = core.weatherDamageMult(t, w);
  console.log(`${w}+${t}: ${got} (esperado ${exp})`, got===exp?'OK':'FAIL');
}

console.log('\n=== Speed abilities por clima ===');
const m = { abilities:['chlorophyll'] };
console.log('chlorophyll+sun:', core.abilitySpeedMult(m,'sun'), '(esperado 2)');
console.log('chlorophyll+rain:', core.abilitySpeedMult(m,'rain'), '(esperado 1)');
const m2 = { abilities:['swift-swim'] };
console.log('swift-swim+rain:', core.abilitySpeedMult(m2,'rain'), '(esperado 2)');
const m3 = { abilities:['sand-rush'] };
console.log('sand-rush+sandstorm:', core.abilitySpeedMult(m3,'sandstorm'), '(esperado 2)');
const m4 = { abilities:['slush-rush'] };
console.log('slush-rush+hail:', core.abilitySpeedMult(m4,'hail'), '(esperado 2)');

console.log('\n=== Weather setters por ability switch-in ===');
const mw1 = { abilities:['drizzle'], name:'A' };
const r1 = core.abilitySwitchIn(mw1, {});
console.log('drizzle:', r1.find(e=>e.weather), '(esperado weather=rain)');

const mw2 = { abilities:['drought'], name:'B' };
const r2 = core.abilitySwitchIn(mw2, {});
console.log('drought:', r2.find(e=>e.weather), '(esperado weather=sun)');

const mw3 = { abilities:['sand-stream'], name:'C' };
const r3 = core.abilitySwitchIn(mw3, {});
console.log('sand-stream:', r3.find(e=>e.weather), '(esperado weather=sandstorm)');
