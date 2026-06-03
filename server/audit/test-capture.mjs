// Reimplementa formula EXATA do battle.js:1132
function chance(item, hpRatio) {
  const baseRate = 0.55;
  let c = baseRate * item.mult * (1 - hpRatio*0.7);
  return Math.max(0.06, Math.min(0.96, c));
}

console.log('=== Pokebola normal vs Mewtwo full HP ===');
console.log('Poke (1.0×) full:', chance({mult:1.0}, 1.0).toFixed(3), '(esperado ~0.165 — 30% HP cut)');
console.log('Poke 50%:', chance({mult:1.0}, 0.5).toFixed(3));
console.log('Poke 10%:', chance({mult:1.0}, 0.1).toFixed(3));
console.log('Poke 0%:', chance({mult:1.0}, 0.0).toFixed(3));
console.log('Great (1.5×) 10%:', chance({mult:1.5}, 0.1).toFixed(3));
console.log('Ultra (2.0×) 10%:', chance({mult:2.0}, 0.1).toFixed(3));
console.log('Master (255×) full:', chance({mult:255}, 1.0).toFixed(3), '(esperado 0.96 cap)');

console.log('\n=== Master Ball deveria SEMPRE capturar ===');
const masterFull = chance({mult:255}, 1.0);
console.log('Master vs full HP:', masterFull, masterFull===1 ? 'OK (sempre)' : `FAIL (${masterFull*100}% chance)`);

console.log('\n=== Distribuição: 100 jogadas Poke vs HP 0% ===');
let success = 0;
for (let i=0;i<10000;i++) if (Math.random() < chance({mult:1.0}, 0)) success++;
console.log(`taxa: ${(success/100).toFixed(1)}% (formula: ${(chance({mult:1.0},0)*100).toFixed(1)}%)`);

console.log('\n=== Comparacao canonical Gen 5: a Pokemon com baseCatchRate 45 (Charmander) HP 10%, no status, Pokebola ===');
// canonical: a = ((3*100 - 2*10) * 45 * 1) / (3*100) * 1 = (280*45)/300 = 42
// b = sqrt(sqrt(65535/a)) ... muito complicado. Mas simplificado: ~42/255 = 16.5%
// Codigo: 0.55 * 1.0 * (1 - 0.1*0.7) = 0.55 * 0.93 = 0.5115 -> 51%
// O codigo da uma chance MUITO maior que canonical para baseCatchRate medio (45).
console.log('codigo retorna:', (chance({mult:1.0}, 0.1)*100).toFixed(1)+'%');
console.log('canonical aprox: 16.5% (Charmander 10% HP)');
console.log('DIFERENCA: codigo nao considera catchRate por espécie — todas iguais');
