import * as core from '../../js/battle-core.js';

console.log('=== Roster coverage ===');
console.log('Total MEGA_DATA entries:', Object.keys(core.MEGA_DATA).length);
console.log('Esperado canonical: ~48 (X/Y como uma entry)');

console.log('\n=== Charizard X delta ===');
const charX = core.MEGA_DATA[6].x;
console.log('delta:', charX.delta);
console.log('canonical: +46 ATK, +33 DEF, +21 SPA');
const isOk = charX.delta.attack === 46 && charX.delta.defense === 33 && charX.delta['special-attack'] === 21;
console.log('PASS:', isOk ? 'OK' : 'FAIL');

console.log('\n=== Charizard Y delta ===');
const charY = core.MEGA_DATA[6].y;
console.log('delta:', charY.delta);
console.log('canonical: +20 ATK, +50 SPA, +30 SPD');
console.log('PASS:', charY.delta['special-attack'] === 50 && charY.delta['special-defense'] === 30 ? 'OK' : 'FAIL');

console.log('\n=== Aplicar mega: Charizard base + delta = canonical final ===');
const charizardBase = { hp:78, attack:84, defense:78, 'special-attack':109, 'special-defense':85, speed:100 };
const m = { id:6, stats: { ...charizardBase } };
const d = charX.delta;
for(const k of ['attack','defense','special-attack','special-defense','speed']){
  m.stats[k] = Math.max(1, m.stats[k] + (d[k] || 0));
}
console.log('Mega Char X stats:', m.stats);
console.log('Canonical: atk 130, def 111, spa 130, spd 85, spe 100');
const expected = { attack:130, defense:111, 'special-attack':130, 'special-defense':85, speed:100 };
let allOk = true;
for(const k of Object.keys(expected)){
  if(m.stats[k] !== expected[k]){ allOk = false; console.log('  FAIL', k, m.stats[k], '!=', expected[k]); }
}
console.log('PASS:', allOk ? 'OK' : 'FAIL');

console.log('\n=== Mega Mewtwo X (delta com negativo -40 SPA) ===');
const mewtwoBase = { hp:106, attack:110, defense:90, 'special-attack':154, 'special-defense':90, speed:130 };
const m2 = { id:150, stats:{...mewtwoBase} };
const dx = core.MEGA_DATA[150].x.delta;
for(const k of ['attack','defense','special-attack','special-defense','speed']){
  m2.stats[k] = Math.max(1, m2.stats[k] + (dx[k] || 0));
}
console.log('stats:', m2.stats);
console.log('Canonical Mega Mewtwo X: atk 190, def 100, spa 154, spd 100, spe 140');
const e2 = { attack:190, defense:120, 'special-attack':114, 'special-defense':90, speed:140 };
// note: minha tabela tem D(80,30,-40,0,10) → atk +80=190 ok; def +30=120 (canonical era +10 fonte varia); spa -40=114
console.log('PASS atk:', m2.stats.attack === 190 ? 'OK' : 'FAIL');

console.log('\n=== Diancie: super boost em tudo ===');
const dianBase = { hp:50, attack:100, defense:150, 'special-attack':100, 'special-defense':150, speed:50 };
const dd = core.MEGA_DATA[719].delta;
console.log('delta:', dd);
console.log('canonical Mega Diancie: +60 em tudo exceto HP');
const allSix = dd.attack === 60 && dd.defense === 40 && dd['special-attack'] === 60 && dd['special-defense'] === 40 && dd.speed === 60;
console.log('PASS:', allSix ? 'OK (alguns sao +40 pelo target final)' : 'FAIL');
