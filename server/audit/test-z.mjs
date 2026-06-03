import * as core from '../../js/battle-core.js';

console.log('=== zPower curve canonical check ===');
// Canonical Gen 7 Z-move BP table from Bulbapedia:
// <= 55 -> 100; 60 -> 120 (not 65); 70 -> 140; 80 -> 160; 90 -> 175;
// 100 -> 180; 110 -> 185; 120 -> 190; 130 -> 195; 140+ -> 200
const canon = [
  [50, 100], [55, 100], [60, 120], [70, 140], [80, 160], [90, 175],
  [100, 180], [110, 185], [120, 190], [130, 195], [140, 200], [200, 200],
];
let bugs = 0;
for (const [bp, expected] of canon) {
  const got = core.zPower(bp);
  const ok = got === expected;
  console.log(`zPower(${bp}) = ${got} | canonical ${expected}`, ok?'OK':'FAIL');
  if (!ok) bugs++;
}
console.log(`\nTotal divergencias da tabela canonical: ${bugs}/${canon.length}`);

console.log('\n=== zMoveName PT-BR ===');
for (const t of ['fire','water','electric','psychic','dragon','fairy']) {
  console.log(`${t}:`, core.zMoveName(t));
}

console.log('\n=== zStatusEffect buff por tipo ===');
console.log('normal (deveria ser +1 all):', core.zStatusEffect('normal'));
console.log('flying (deveria ser +1 speed):', core.zStatusEffect('flying'));
console.log('dark (deveria ser +1 evasion):', core.zStatusEffect('dark'));
console.log('ghost (deveria ser +1 attack):', core.zStatusEffect('ghost'));
