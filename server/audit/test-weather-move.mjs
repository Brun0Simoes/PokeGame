import * as core from '../../js/battle-core.js';

console.log('=== Weather moves ===');
const cases = [
  ['sunny-day', 'sun'],
  ['rain-dance', 'rain'],
  ['sandstorm', 'sandstorm'],
  ['hail', 'hail'],
  ['snowscape', 'hail'],
  ['chilly-reception', 'hail'],
  ['ember', null],
  ['thunder', null],
];
let ok=0;
for (const [m, exp] of cases) {
  const got = core.moveSetsWeather(m);
  console.log(`${m}: ${got} (esperado ${exp})`, got===exp?'OK':'FAIL');
  if (got===exp) ok++;
}
console.log(`\n${ok}/${cases.length} pass`);
