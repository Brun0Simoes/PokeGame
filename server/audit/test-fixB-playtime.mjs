// Simula o batch playtime

let _pending = 0;
let writes = 0;

const fakeSave = { trainer: { hoursPlayed: 0, lastPlayed: 0 } };

function flushPlaytime(){
  if(_pending === 0) return;
  fakeSave.trainer.hoursPlayed += _pending / 3600;
  fakeSave.trainer.lastPlayed = Date.now();
  writes++;
  _pending = 0;
}

console.log('=== Cenario: 1 hora de jogo ===');
// 3600 tick (1s cada)
for (let s=0;s<3600;s++) {
  _pending++;
  // flush a cada 30s
  if (s % 30 === 29) flushPlaytime();
}
// flush final no beforeunload
flushPlaytime();

console.log('Writes em 1h:', writes, '(esperado 120 = 60min/0.5min)');
console.log('Horas jogadas:', fakeSave.trainer.hoursPlayed.toFixed(6), '(esperado 1.000000)');
console.log('PASS:', writes === 120 && Math.abs(fakeSave.trainer.hoursPlayed - 1) < 0.0001 ? 'OK' : 'FAIL');

console.log('\n=== Comparacao com versao antiga (1 write/s) ===');
const oldWrites = 3600;
console.log(`Antes: ${oldWrites} writes/h | Agora: ${writes} writes/h | Reducao: ${((1 - writes/oldWrites)*100).toFixed(1)}%`);

console.log('\n=== Cenario: tab fechada antes de 30s — beforeunload garante flush ===');
_pending = 0; writes = 0;
fakeSave.trainer.hoursPlayed = 0;
// 15s de jogo
for (let s=0;s<15;s++) _pending++;
// usuario fecha tab → beforeunload dispara
flushPlaytime();
console.log('Writes:', writes, 'horas:', fakeSave.trainer.hoursPlayed.toFixed(6), '(esperado 15s = 0.004167h)');
console.log('PASS:', writes === 1 && Math.abs(fakeSave.trainer.hoursPlayed - 15/3600) < 0.0001 ? 'OK (flush salvou)' : 'FAIL');

console.log('\n=== Cenario: usuario nao logado — nao acumula ===');
_pending = 0; writes = 0;
// codigo real: `if(Store.currentEmail()) _pendingPlayTime++` — so acumula se logado
let loggedIn = false;
for (let s=0;s<60;s++) {
  if (loggedIn) _pending++;
}
flushPlaytime();
console.log('Writes:', writes, 'pending:', _pending);
console.log('PASS:', writes === 0 ? 'OK' : 'FAIL');
