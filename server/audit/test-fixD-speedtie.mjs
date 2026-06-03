function order(pSpeed, eSpeed, pPrio, ePrio, pQuick) {
  const speedTie = pSpeed === eSpeed;
  const speedWin = speedTie ? Math.random() < 0.5 : pSpeed > eSpeed;
  return pPrio !== ePrio ? pPrio > ePrio : (pQuick ? true : speedWin);
}

console.log('=== Speed tie 100 vs 100, no priority — distribuicao ~50/50 ===');
let pFirst = 0;
const N = 10000;
for (let i=0;i<N;i++) if (order(100,100,0,0,false)) pFirst++;
console.log(`Jogador primeiro: ${(pFirst/N*100).toFixed(1)}% (esperado ~50%)`);
console.log('PASS:', Math.abs(pFirst/N - 0.5) < 0.02 ? 'OK' : 'FAIL');

console.log('\n=== Speed diferente — sempre o mais rapido ===');
let r = 0;
for (let i=0;i<1000;i++) if (order(200,100,0,0,false)) r++;
console.log('200 vs 100:', r/1000*100+'% (esperado 100%)');

r = 0;
for (let i=0;i<1000;i++) if (order(50,100,0,0,false)) r++;
console.log('50 vs 100:', r/1000*100+'% (esperado 0%)');

console.log('\n=== Priority diferente — domina sobre speed ===');
r = 0;
for (let i=0;i<1000;i++) if (order(50,100,1,0,false)) r++;
console.log('Player priority +1, slower:', r/1000*100+'% (esperado 100%)');

r = 0;
for (let i=0;i<1000;i++) if (order(100,100,0,2,false)) r++;
console.log('Player no prio, enemy +2:', r/1000*100+'% (esperado 0%)');

console.log('\n=== Quick Claw pula em speed tie ===');
r = 0;
for (let i=0;i<1000;i++) if (order(50,200,0,0,true)) r++;
console.log('Quick claw + slow:', r/1000*100+'% (esperado 100% — quick claw forca prio)');

console.log('\n=== ANTES do fix: speed tie SEMPRE player ===');
function brokenOrder(pSpeed, eSpeed, pPrio, ePrio, pQuick) {
  return pPrio !== ePrio ? pPrio > ePrio : (pQuick ? true : pSpeed >= eSpeed);
}
r = 0;
for (let i=0;i<1000;i++) if (brokenOrder(100,100,0,0,false)) r++;
console.log(`Antes (100v100): jogador primeiro ${r/10}% (BUG: sempre 100%)`);
