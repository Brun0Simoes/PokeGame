// Simula a logica de _abortBattle + _finishDefeat (sem DOM)

function simulateAbort(engine) {
  if (engine.mode === 'over') return { action: 'close-only', result: engine.lastResult };
  if (engine.isWild) {
    return { action: 'flee-without-penalty', result: 'flee_player' };
  }
  // trainer: confirmacao + _finishDefeat
  const fine = Math.min(engine.save.money, 500);
  engine.save.money -= fine;
  engine.lastResult = 'lose';
  return { action: 'defeat-with-fine', result: 'lose', fine };
}

console.log('=== Cenario 1: Wild - X fecha sem multa ===');
let e = { mode:'main', isWild:true, save:{money:5000} };
let r = simulateAbort(e);
console.log(r, 'saldo:', e.save.money);
console.log('PASS:', r.action === 'flee-without-penalty' && e.save.money === 5000 ? 'OK' : 'FAIL');

console.log('\n=== Cenario 2: Trainer - X aplica multa ===');
e = { mode:'main', isWild:false, save:{money:5000} };
r = simulateAbort(e);
console.log(r, 'saldo:', e.save.money);
console.log('PASS:', r.fine === 500 && e.save.money === 4500 && r.result === 'lose' ? 'OK' : 'FAIL');

console.log('\n=== Cenario 3: Trainer com pouco dinheiro - multa cap ===');
e = { mode:'main', isWild:false, save:{money:200} };
r = simulateAbort(e);
console.log(r, 'saldo:', e.save.money);
console.log('PASS:', r.fine === 200 && e.save.money === 0 ? 'OK (capped no saldo)' : 'FAIL');

console.log('\n=== Cenario 4: Modo over - apenas fecha ===');
e = { mode:'over', isWild:false, save:{money:5000}, lastResult:'win' };
r = simulateAbort(e);
console.log(r);
console.log('PASS:', r.action === 'close-only' && e.save.money === 5000 ? 'OK' : 'FAIL');

console.log('\n=== ANTES do fix (regression): X em trainer = flee_player sem multa ===');
function brokenAbort(engine) {
  return { action: 'flee-without-penalty', result: 'flee_player' };
}
e = { mode:'main', isWild:false, save:{money:5000} };
const broken = brokenAbort(e);
console.log('Antes:', broken, 'saldo:', e.save.money, '(BUG: jogador sai sem perder dinheiro!)');
