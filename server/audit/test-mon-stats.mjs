import * as ms from '../../js/mon-stats.js';

console.log('=== HP formula vs canonical ===');
// canonical HP: ((2*base + IV + ev/4) * level / 100) + level + 10
// Charizard base HP 78, IV 31, EV 252, Lvl 100:
// (2*78+31+63)*100/100 + 100 + 10 = (156+31+63)+110 = 250+110 = 360
let h = ms.computeStat('hp', 78, 31, 252, 100, 'hardy');
console.log('Charizard HP@100/31IV/252EV:', h, '(canonical 360)');

console.log('\n=== Non-HP formula com nature ===');
// canonical non-HP: ((2*base + IV + ev/4) * level / 100 + 5) * nature
// Adamant +ATK -SPA. Charizard atk base 84, IV 31, EV 252, Lvl 100, Adamant:
// ((168+31+63)*100/100+5) * 1.1 = (262+5)*1.1 = 267*1.1 = 293.7 → 293
let a = ms.computeStat('attack', 84, 31, 252, 100, 'adamant');
console.log('Char ATK@100/31/252/Adamant:', a, '(canonical 293)');

let s = ms.computeStat('special-attack', 109, 31, 252, 100, 'modest');
console.log('Char SPA@100/31/252/Modest:', s, '(canonical: 2*109+31+63=312; (312+5)*1.1=348.7→348)');

console.log('\n=== Natures roster ===');
console.log('Total naturezas:', Object.keys(ms.NATURES).length, '(canonical 25)');
console.log('Lista:', Object.keys(ms.NATURES).join(', '));
console.log('Nature names PT-BR:', Object.keys(ms.NATURE_NAMES_PT).length);

console.log('\n=== Nature mods ===');
console.log('adamant +attack:', ms.natureMod('adamant', 'attack'), '(esperado 1.1)');
console.log('adamant -SPA:', ms.natureMod('adamant', 'special-attack'), '(esperado 0.9)');
console.log('hardy attack:', ms.natureMod('hardy', 'attack'), '(esperado 1 — neutral)');
console.log('modest +SPA:', ms.natureMod('modest', 'special-attack'), '(esperado 1.1)');
console.log('jolly +SPE:', ms.natureMod('jolly', 'speed'), '(esperado 1.1)');

console.log('\n=== Limits ===');
console.log('MAX_IV:', ms.MAX_IV);
console.log('MAX_EV_STAT:', ms.MAX_EV_STAT);
console.log('MAX_EV_TOTAL:', ms.MAX_EV_TOTAL);

console.log('\n=== Random IVs distribution ===');
const r = ms.randomIVs();
console.log('keys:', Object.keys(r));
console.log('all in [0,31]:', Object.values(r).every(v=>v>=0&&v<=31)?'OK':'FAIL');

console.log('\n=== recompute ===');
const mon = {
  level:50, base:{hp:78,attack:84,defense:78,'special-attack':109,'special-defense':85,speed:100},
  ivs:{hp:31,attack:31,defense:31,'special-attack':31,'special-defense':31,speed:31},
  evs:ms.zeroEVs(), nature:'hardy'
};
ms.recomputeStats(mon);
console.log('Charizard@50/31IV/0EV/hardy stats:', mon.stats);
console.log('Esperado canonical: hp 167, atk 104, def 98, spa 130(.7→130), spd 105, spe 121');
