// Simula end-of-turn ordering: weather → status → leftovers → sitrus

function endOfTurn(mon, weather) {
  const log = [];
  // 1. weather chip
  if (weather === 'sandstorm') {
    const dmg = Math.max(1, Math.floor(mon.maxHp/16));
    mon.hp = Math.max(0, mon.hp - dmg);
    log.push(`sand chip ${dmg}`);
  }
  // 2. (terrain heal — skip)
  if (mon.hp <= 0) return log;
  // 3. status (poison)
  if (mon.status === 'poisoned') {
    const dmg = Math.max(1, Math.floor(mon.maxHp/8));
    mon.hp = Math.max(0, mon.hp - dmg);
    log.push(`psn ${dmg}`);
  }
  if (mon.hp <= 0) return log;
  // 4. ability (skip)
  // 5. leftovers
  if (mon.held === 'leftovers' && mon.hp < mon.maxHp) {
    const heal = Math.max(1, Math.floor(mon.maxHp/16));
    mon.hp = Math.min(mon.maxHp, mon.hp + heal);
    log.push(`leftovers +${heal}`);
  }
  // 6. sitrus (FIX: reage ao HP final)
  if (mon.held === 'sitrus' && mon.hp <= mon.maxHp*0.5 && !mon.sitrusUsed) {
    mon.sitrusUsed = true;
    const heal = Math.floor(mon.maxHp*0.25);
    mon.hp = Math.min(mon.maxHp, mon.hp + heal);
    log.push(`sitrus +${heal}`);
  }
  return log;
}

console.log('=== Cenario 1 (bug original): weather leva mon de 51% pra 45% — sitrus DEVE procar ===');
let m = { hp: 51, maxHp: 100, status:'none', held:'sitrus' };
let log = endOfTurn(m, 'sandstorm');
console.log('log:', log, 'final hp:', m.hp);
console.log('PASS:', log.includes('sand chip 6') && log.find(x=>x.startsWith('sitrus')) && m.hp === 70 ? 'OK' : 'FAIL');

console.log('\n=== Cenario 2: HP 50% + poison nao mata, sitrus reage ===');
m = { hp: 50, maxHp: 100, status:'poisoned', held:'sitrus' };
log = endOfTurn(m, 'none');
console.log('log:', log, 'final hp:', m.hp);
console.log('PASS:', log.find(x=>x.startsWith('psn')) && log.find(x=>x.startsWith('sitrus')) ? 'OK' : 'FAIL');

console.log('\n=== Cenario 3: Sitrus + leftovers — leftovers heal antes ===');
m = { hp: 30, maxHp: 100, status:'none', held:'leftovers' };  // só leftovers
log = endOfTurn(m, 'none');
console.log('log:', log, 'final hp:', m.hp, '(esperado 30+6=36)');
console.log('PASS:', m.hp === 36 ? 'OK' : 'FAIL');

console.log('\n=== Cenario 4: HP 60% (acima de 50%) — sitrus NAO procar ===');
m = { hp: 60, maxHp: 100, status:'none', held:'sitrus' };
log = endOfTurn(m, 'none');
console.log('log:', log, 'final hp:', m.hp);
console.log('PASS:', m.hp === 60 && log.length === 0 ? 'OK' : 'FAIL');

console.log('\n=== Cenario 5: Sitrus one-shot ===');
m = { hp: 40, maxHp: 100, status:'none', held:'sitrus' };
endOfTurn(m, 'none');
const hpAfter1 = m.hp;
// Sofre mais dano
m.hp = 30;
const log2 = endOfTurn(m, 'none');
console.log('Segundo turno: sitrus ja consumido?', !log2.find(x=>x.startsWith('sitrus')) ? 'OK' : 'FAIL');

console.log('\n=== Cenario 6 (regression do bug): ANTES sitrus procava antes do weather ===');
console.log('Cenario: HP 50%, weather sandstorm');
console.log('Antes: sitrus + leftovers procavam (HP <= 50%) ANTES do weather chip → HP termina 70');
console.log('Depois weather chip → 70-6 = 64 (sem sitrus dispoonivel na proxima)');
console.log('AGORA: weather chip primeiro → HP 44 → sitrus reage → 69');
m = { hp: 50, maxHp: 100, status:'none', held:'sitrus' };
endOfTurn(m, 'sandstorm');
console.log('HP final:', m.hp, '(esperado: 50-6=44+25=69)');
console.log('PASS:', m.hp === 69 ? 'OK' : 'FAIL');
