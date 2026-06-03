import { xpForLevel } from '../../js/data.js';

// Codigo: gainfull = (baseExp * enemy.level) / 7
// Canonical Gen 5+: gain = (baseExp * level * trade * lucky * affection * a * t * p / (7 * num))
// Default simplified: (baseExp * level) / 7

console.log('=== XP gain Lv 30 vs baseExp 80 ===');
const gain = Math.floor((80 * 30) / 7);
console.log('gain:', gain, '(canonical aprox: 80*30/7 = 342 — mesmo)');

console.log('\n=== xpForLevel curve ===');
console.log('Lvl 5:', xpForLevel(5));
console.log('Lvl 10:', xpForLevel(10));
console.log('Lvl 50:', xpForLevel(50));
console.log('Lvl 100:', xpForLevel(100));

console.log('\n=== Quanto XP precisa para subir 1 -> 100? ===');
console.log('canonical medium-fast: 1,000,000');
console.log('codigo (100):', xpForLevel(100));

console.log('\n=== HP recompute on level up ===');
// codigo battle.js:1022: newMax = Math.floor((2*stats.hp + 31) * level / 100) + level + 10
// canonical: HP = (2*Base + IV + EV/4) * level / 100 + level + 10
// Codigo: assume IV=31, EV=0
const base = 78; // Charizard HP base
const lvl = 50;
const newMax = Math.floor((2*base + 31) * lvl / 100) + lvl + 10;
console.log(`Charizard HP@50 (codigo): ${newMax} | canonical 31IV 0EV: ${Math.floor((2*78+31+0)*50/100)+50+10}`);
