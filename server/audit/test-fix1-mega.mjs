// Simula o cleanup do _close: restaura mons mega/dynamax pos-batalha

function cleanup(mon) {
  if (mon && mon._megaBackup) {
    mon.stats = mon._megaBackup.stats;
    mon.types = mon._megaBackup.types;
    delete mon._megaBackup;
    mon._mega = false;
  }
  if (mon && mon._maxBackup) {
    const ratio = mon.maxHp > 0 ? mon.hp / mon.maxHp : 1;
    mon.maxHp = mon._maxBackup.maxHp;
    mon.hp = Math.max(0, Math.min(mon.maxHp, Math.round(mon.maxHp * ratio)));
    delete mon._maxBackup;
    mon._dyna = false;
    mon._gmax = false;
  }
}

console.log('=== Cenario 1: Mega Charizard X — stats devem voltar ===');
const charizard = {
  id: 6, name: 'charizard',
  stats: { hp:78, attack:84, defense:78, 'special-attack':109, 'special-defense':85, speed:100 },
  types: ['fire','flying'],
};
// Simula _doMega
charizard._megaBackup = { stats: {...charizard.stats}, types: [...charizard.types] };
for (const k of ['attack','defense','special-attack','special-defense','speed']) {
  charizard.stats[k] = Math.round(charizard.stats[k] * 1.2);
}
charizard.types = ['fire','dragon'];
charizard._mega = true;
console.log('Apos mega: ATK', charizard.stats.attack, 'tipos', charizard.types, 'flag', charizard._mega);

// Apos batalha
cleanup(charizard);
console.log('Apos _close: ATK', charizard.stats.attack, 'tipos', charizard.types, 'flag', charizard._mega);
console.log('Backup limpo:', !charizard._megaBackup, '(esperado true)');
console.log('PASS:', 
  charizard.stats.attack === 84 &&
  charizard.types[0] === 'fire' && charizard.types[1] === 'flying' &&
  charizard._mega === false &&
  !charizard._megaBackup ? 'OK' : 'FAIL');

console.log('\n=== Cenario 2: Dynamax — HP volta proporcionalmente ===');
const pika = { hp:80, maxHp:100 };
// Simula _doDynamax
pika._maxBackup = { hp: pika.hp, maxHp: pika.maxHp };
pika.maxHp = Math.round(pika.maxHp * 2);  // 200
pika.hp = Math.round(pika.hp * 2);         // 160
pika._dyna = true;
console.log('Apos dyna:', pika.hp, '/', pika.maxHp);
// Sofre dano
pika.hp -= 70; // = 90/200 = 45%
console.log('Apos dano 70:', pika.hp, '/', pika.maxHp);

cleanup(pika);
console.log('Apos _close:', pika.hp, '/', pika.maxHp, '(esperado ~45/100 — 45%)');
console.log('PASS:', pika.maxHp === 100 && Math.abs(pika.hp - 45) <= 1 && !pika._dyna && !pika._maxBackup ? 'OK' : 'FAIL');

console.log('\n=== Cenario 3: Mon sem mega/dyna — nao mexer ===');
const normal = { stats:{attack:50}, types:['water'], hp:30, maxHp:50 };
cleanup(normal);
console.log('atk:', normal.stats.attack, 'tipos:', normal.types, 'hp:', normal.hp);
console.log('PASS:', normal.stats.attack === 50 && normal.types[0] === 'water' && normal.hp === 30 ? 'OK' : 'FAIL');

console.log('\n=== Cenario 4: Mon nulo — nao quebra ===');
try { cleanup(null); cleanup(undefined); console.log('PASS: OK (no throw)'); }
catch (e) { console.log('FAIL:', e.message); }

console.log('\n=== Cenario 5 (bug #4): Switch mid-Dynamax — backup ainda restaurado ===');
const wasActive = { hp:80, maxHp:100, _maxBackup:{ hp:80, maxHp:100 } };
wasActive.maxHp = 200; wasActive.hp = 160; wasActive._dyna = true;
// Player troca de mon. Wat ativa eh outro. Wat continua em playerTeam.
// _close itera TODOS — deve restaurar
const newActive = { hp:100, maxHp:100 }; // mon normal, nunca dyna
cleanup(wasActive);
cleanup(newActive);
console.log('Era ativo:', wasActive.hp, '/', wasActive.maxHp, 'dyna:', wasActive._dyna);
console.log('Novo:', newActive.hp, '/', newActive.maxHp);
console.log('PASS:', wasActive.maxHp === 100 && wasActive._dyna === false && newActive.maxHp === 100 ? 'OK' : 'FAIL');
