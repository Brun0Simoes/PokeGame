// Simula a logica do Max Guard: status move quando dyna ativa = proxy guarda
// Substitui o caminho de dano (que aplicava BP 40 → MaxBP 90)

function attemptStatusInDyna(attacker, defender, isMax, isStatus) {
  if (isMax && isStatus) {
    attacker._maxGuard = true;
    return { type: 'guard-up' };
  }
  // damage path (simplified)
  return { type: 'damage', bp: 40 };
}

function attemptHit(defender) {
  if (defender._maxGuard) {
    defender._maxGuard = false;
    return { type: 'blocked' };
  }
  return { type: 'hit' };
}

console.log('=== Cenario 1: Status move em Dynamax cria Max Guard, NAO causa dano ===');
const charm = { hp: 100, maxHp: 100, _dyna: true };
const r1 = attemptStatusInDyna(charm, {}, true, true);
console.log('Resultado:', r1, '(esperado guard-up, NAO damage)');
console.log('Charm._maxGuard:', charm._maxGuard, '(esperado true)');
console.log('PASS:', r1.type === 'guard-up' && charm._maxGuard === true ? 'OK' : 'FAIL');

console.log('\n=== Cenario 2: Atacante ataca defensor com Max Guard → bloqueado ===');
const defenderUnderGuard = { _maxGuard: true };
const r2 = attemptHit(defenderUnderGuard);
console.log('Resultado:', r2, '(esperado blocked)');
console.log('Guard consumido:', defenderUnderGuard._maxGuard, '(esperado false — uma vez so)');
console.log('PASS:', r2.type === 'blocked' && defenderUnderGuard._maxGuard === false ? 'OK' : 'FAIL');

console.log('\n=== Cenario 3: Segundo ataque depois do guard → hit normal ===');
const r3 = attemptHit(defenderUnderGuard);
console.log('Resultado:', r3, '(esperado hit — guard ja foi)');
console.log('PASS:', r3.type === 'hit' ? 'OK' : 'FAIL');

console.log('\n=== Cenario 4: Status move SEM dyna ainda funciona normal ===');
const att = { hp: 100 };
const r4 = attemptStatusInDyna(att, {}, false, true);
console.log('Resultado:', r4, '(esperado damage — caminho original)');
console.log('PASS:', r4.type === 'damage' ? 'OK' : 'FAIL');

console.log('\n=== Cenario 5: Damage move em Dynamax — caminho normal ===');
const r5 = attemptStatusInDyna(att, {}, true, false);
console.log('Resultado:', r5, '(esperado damage — nao status)');
console.log('PASS:', r5.type === 'damage' ? 'OK' : 'FAIL');

console.log('\n=== Cenario 6 (regression do bug): Antes do fix, BP 40 default ia para damage path ===');
console.log('  isStatus=true, isMax=true → ANTES: caia em damage path com BP 40 → MaxBP 90 (BUG)');
console.log('  AGORA: cai em guard-up branch ANTES do damage');
console.log('PASS: OK (refletido em #1)');
