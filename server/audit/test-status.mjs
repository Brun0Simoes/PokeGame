import * as core from '../../js/battle-core.js';

console.log('=== freeze thaw chance: 20% canonical ===');
let thawed = 0;
for (let i=0;i<10000;i++) {
  const m = { status:'frozen', name:'X' };
  const r = core.preMoveStatus(m);
  if (r.canAct && m.status==='none') thawed++;
}
const rate = thawed/10000;
console.log(`thaw rate: ${(rate*100).toFixed(2)}% (esperado ~20%)`);
console.log('PASS:', Math.abs(rate-0.2)<0.02 ? 'OK' : 'FAIL');

console.log('\n=== paralisia miss chance: 25% canonical ===');
let missed = 0;
for (let i=0;i<10000;i++) {
  const m = { status:'paralyzed', name:'X' };
  const r = core.preMoveStatus(m);
  if (!r.canAct) missed++;
}
console.log(`miss rate: ${(missed/10000*100).toFixed(2)}% (esperado ~25%)`);
console.log('PASS:', Math.abs(missed/10000 - 0.25)<0.02 ? 'OK' : 'FAIL');

console.log('\n=== sleep counter: 1-3 turnos canonical (Gen 5+) ===');
const counts = { 1:0, 2:0, 3:0, other:0 };
for (let i=0;i<10000;i++) {
  const m = { status:'asleep', name:'X' };
  let turns = 0;
  // simula até acordar
  while (m.status === 'asleep' && turns < 20) {
    core.preMoveStatus(m);
    turns++;
    if (m.status === 'none') break;
  }
  if (counts[turns] != null) counts[turns]++; else counts.other++;
}
console.log('distribuicao turnos ate acordar:', counts);
// canonical: 1-3 turns, mas o codigo seta _sleepTurns no applyStatus E em preMoveStatus se for null
// vou checar...

console.log('\n=== applyStatus seta sleep counter? ===');
const m1 = { status:'none', types:[] };
const r1 = core.applyStatus(m1, 'asleep');
console.log('applied:', r1, '| _sleepTurns:', m1._sleepTurns, '(esperado 1-3)');

console.log('\n=== confusion 2-4 turnos ===');
const distrib = { 0:0, 1:0, 2:0, 3:0, 4:0, other:0 };
for (let i=0;i<5000;i++) {
  const m = { _confused: undefined };
  const applied = core.applyConfusion(m);
  if (!applied) { distrib.other++; continue; }
  const initial = m._confused;
  if (initial>=2 && initial<=4) distrib[initial]++; else distrib.other++;
}
console.log('initial confusion turns:', distrib, '(esperado: cada 2,3,4 ~1666 ocorrencias)');

console.log('\n=== confusion self-hit chance: 33% (Gen 7+) / 50% (Gen <=6) ===');
let hits = 0;
for (let i=0;i<10000;i++) {
  const m = { _confused: 4 };
  const r = core.tickConfusion(m);
  if (r.hitsSelf) hits++;
}
console.log(`self-hit rate: ${(hits/10000*100).toFixed(2)}% (codigo usa 1/3 = 33%, canonical Gen7+ = 33%)`);
console.log('PASS:', Math.abs(hits/10000 - 1/3) < 0.02 ? 'OK' : 'FAIL');

console.log('\n=== applyStatus rejeita se ja com status ===');
const m2 = { status:'poisoned', types:[] };
const r2 = core.applyStatus(m2, 'burned');
console.log('ja envenenado, tentar queimar:', r2, '(esperado ok:false)');
