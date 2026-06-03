function captureChance(item, hpRatio) {
  const baseRate = 0.55;
  const isMaster = item.ballTag === 'master' || (item.mult || 0) >= 255;
  if (isMaster) return { chance: 1, isMaster: true };
  let c = baseRate * item.mult * (1 - hpRatio*0.7);
  c = Math.max(0.06, Math.min(0.96, c));
  return { chance: c, isMaster: false };
}

console.log('=== Master Ball SEMPRE captura ===');
const master = { ballTag:'master', mult: 255 };
console.log('full HP:', captureChance(master, 1.0));
console.log('50% HP:', captureChance(master, 0.5));
console.log('1% HP:', captureChance(master, 0.01));
console.log('PASS:', captureChance(master, 1).chance === 1 ? 'OK' : 'FAIL');

console.log('\n=== Outras bolas continuam clampadas ===');
const poke = { mult: 1.0 };
const ultra = { mult: 2.0 };
console.log('Poke full HP:', captureChance(poke, 1.0));
console.log('Ultra 10% HP:', captureChance(ultra, 0.1));
console.log('Ultra 0% HP:', captureChance(ultra, 0));
console.log('  Cap 0.96 ainda aplicado:', captureChance(ultra, 0).chance <= 0.96 ? 'OK' : 'FAIL');

console.log('\n=== Sim: 10000 rolls Master Ball ===');
let success = 0;
for (let i=0;i<10000;i++) {
  const { chance, isMaster } = captureChance(master, 1.0);
  const ok = isMaster || Math.random() < chance;
  if (ok) success++;
}
console.log(`Sucesso: ${success}/10000 (esperado 10000)`);
console.log('PASS:', success === 10000 ? 'OK' : 'FAIL');

console.log('\n=== Sim: 10000 rolls Poke Ball, full HP — taxa esperada 16.5%? ===');
// codigo gera ~16.5% para mons sem catch rate por espécie
let s2 = 0;
for (let i=0;i<10000;i++) {
  const { chance } = captureChance(poke, 1.0);
  if (Math.random() < chance) s2++;
}
console.log(`Sucesso: ${s2}/10000 (esperado ~16-17% — 0.55*1*0.3=0.165)`);

console.log('\n=== Detecta master via ballTag mesmo se mult <255 ===');
const customMaster = { ballTag:'master', mult: 1.0 };  // se algum item futuro
const r = captureChance(customMaster, 1.0);
console.log('custom master:', r, '(esperado chance 1)');
console.log('PASS:', r.chance === 1 ? 'OK' : 'FAIL');
