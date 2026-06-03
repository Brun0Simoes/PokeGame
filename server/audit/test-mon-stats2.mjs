import * as ms from '../../js/mon-stats.js';

console.log('=== computeStat com args corretos ===');
// HP: Charizard base 78, IV 31, EV 252, Lv 100
const baseObj = { hp:78,attack:84,defense:78,'special-attack':109,'special-defense':85,speed:100 };
const ivObj = { hp:31,attack:31,defense:31,'special-attack':31,'special-defense':31,speed:31 };
const evObj = { hp:252,attack:252,defense:0,'special-attack':0,'special-defense':0,speed:0 };

console.log('HP@100/31/252:', ms.computeStat('hp', baseObj, ivObj, evObj, 100, 'hardy'), '(canonical 360)');
console.log('ATK@100/31/252/Adamant:', ms.computeStat('attack', baseObj, ivObj, evObj, 100, 'adamant'), '(canonical 293)');

const evSpa = { hp:0,attack:0,defense:0,'special-attack':252,'special-defense':0,speed:0 };
console.log('SPA@100/31/252/Modest:', ms.computeStat('special-attack', baseObj, ivObj, evSpa, 100, 'modest'), '(canonical 348)');

console.log('\n=== Shedinja-like guard ===');
const shed = { hp:1 };
console.log('Shedinja HP@100:', ms.computeStat('hp', shed, ivObj, evObj, 100, 'hardy'), '(esperado 1)');

console.log('\n=== Distribution randomNature ===');
const dist = {};
for (let i=0;i<10000;i++) {
  const n = ms.randomNature();
  dist[n] = (dist[n]||0)+1;
}
const counts = Object.values(dist);
const mean = counts.reduce((a,b)=>a+b,0)/counts.length;
console.log('mean=', mean, 'min=', Math.min(...counts), 'max=', Math.max(...counts), '(esperado ~400 cada, 25 naturezas em 10000)');
