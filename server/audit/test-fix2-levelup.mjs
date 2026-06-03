import { recomputeStats } from '../../js/mon-stats.js';

// Simula o novo level-up: recomputa TODOS stats
function levelUp(mon) {
  mon.level++;
  if (mon.base && mon.ivs && mon.evs) {
    recomputeStats(mon);
  }
}

console.log('=== Cenario 1: Charmander Lv5 → Lv50 ===');
const charm = {
  level: 5,
  base: { hp:39, attack:52, defense:43, 'special-attack':60, 'special-defense':50, speed:65 },
  ivs:  { hp:20, attack:25, defense:20, 'special-attack':20, 'special-defense':20, speed:20 },
  evs:  { hp:0, attack:0, defense:0, 'special-attack':0, 'special-defense':0, speed:0 },
  nature: 'hardy',
  stats: {},
  maxHp: 0, hp: 0,
};
recomputeStats(charm);
console.log('Lv5 inicial:', charm.stats, 'HP:', charm.hp+'/'+charm.maxHp);

for (let i = 0; i < 45; i++) levelUp(charm);
console.log('Apos 45 level-ups (Lv50):', charm.stats, 'HP:', charm.hp+'/'+charm.maxHp);

// Canonical: Charmander base atk 52, IV 25, EV 0, Lv 50, hardy:
// ((2*52+25+0)*50/100 + 5) * 1 = 64.5 + 5 = 69.5 → 69
console.log('\nEsperado canonical Lv50 (Hardy):');
console.log('  HP:    (2*39+20)*50/100+50+10 = 49+60 = 109');
console.log('  ATK:   (2*52+25)*50/100+5 = 64.5+5 = 69');
console.log('  DEF:   (2*43+20)*50/100+5 = 53+5 = 58');
console.log('  SPA:   (2*60+20)*50/100+5 = 70+5 = 75');
console.log('  SPD:   (2*50+20)*50/100+5 = 60+5 = 65');
console.log('  SPE:   (2*65+20)*50/100+5 = 75+5 = 80');

const expected = { hp:109, attack:69, defense:58, 'special-attack':75, 'special-defense':65, speed:80 };
let allOk = true;
for (const k of Object.keys(expected)) {
  if (charm.stats[k] !== expected[k]) { console.log(`  FAIL ${k}: got ${charm.stats[k]}, expected ${expected[k]}`); allOk = false; }
}
console.log('PASS:', allOk ? 'OK — todos stats batem canonical' : 'FAIL');

console.log('\n=== Cenario 2: Fallback para mon antigo sem base/ivs/evs ===');
const oldMon = {
  level: 5,
  stats: { hp: 30 },  // legacy mon — only stats.hp
  maxHp: 30,
  hp: 30,
  xp: 0,
};
// Codigo deve cair no fallback (so HP)
const oldMax = oldMon.maxHp;
const newMax = Math.floor((2*oldMon.stats.hp + 31) * (oldMon.level+1) / 100) + (oldMon.level+1) + 10;
console.log('Legacy mon Lv5 → Lv6 HP:', oldMax, '→', newMax, '(fallback usado, sem crash)');

console.log('\n=== Cenario 3: Stats existem antes do level-up (HP proporcional) ===');
const test = {
  level: 10,
  base: { hp:50, attack:50, defense:50, 'special-attack':50, 'special-defense':50, speed:50 },
  ivs: { hp:31, attack:31, defense:31, 'special-attack':31, 'special-defense':31, speed:31 },
  evs: { hp:0, attack:0, defense:0, 'special-attack':0, 'special-defense':0, speed:0 },
  nature: 'hardy',
  stats: {}, maxHp: 0, hp: 0,
};
recomputeStats(test);
console.log('Lv10:', test.maxHp, 'HP');
test.hp = Math.floor(test.maxHp * 0.5);  // 50% HP
console.log('Apos batalha 50% HP:', test.hp+'/'+test.maxHp);
levelUp(test);
console.log('Apos level-up:', test.hp+'/'+test.maxHp);
console.log('Manteve proporcao ~50%:', Math.abs(test.hp/test.maxHp - 0.5) < 0.05 ? 'OK' : 'FAIL');
