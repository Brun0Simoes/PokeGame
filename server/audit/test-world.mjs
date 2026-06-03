import { REGIONS, STARTERS, TYPES, TYPE_CHART, typeMultiplier, ITEMS, TMS, STARTING_BAG, STARTING_MONEY, GYMS, NPC_TRAINERS, ELITE_FOUR } from '../../js/data.js';
import { gymsFor, elite4For, championFor, npcsFor } from '../../js/data/world.js';

console.log('=== Regions ===');
console.log('Total:', REGIONS.length, '(esperado 8)');
console.log('IDs:', REGIONS.map(r=>r.id).join(', '));

console.log('\n=== Per region: gyms + elite + champion + NPCs ===');
for (const r of REGIONS) {
  const g = gymsFor(r.id);
  const e = elite4For(r.id);
  const ch = championFor(r.id);
  const n = npcsFor(r.id);
  console.log(`${r.name}: ${g.length} gyms, ${e.length} elite, champ=${ch?.name||'?'}, ${n.length} NPCs`);
}

console.log('\n=== Starters ===');
console.log('Total:', Object.keys(STARTERS).length);
console.log('IDs:', Object.keys(STARTERS).join(', '));

console.log('\n=== Type chart sanity ===');
const cases = [
  ['water','fire',['fire'],2],
  ['fire','water',['water'],0.5],
  ['ground','flying',['flying'],0],
  ['electric','ground',['ground'],0],
  ['ice','dragon',['dragon'],2],
  ['fairy','dragon',['dragon'],2],
  ['dragon','fairy',['fairy'],0],
  ['fighting','ghost',['ghost'],0],
  ['fighting','normal',['normal'],2],
  ['ghost','normal',['normal'],0],
  ['dark','psychic',['psychic'],2],
  ['psychic','dark',['dark'],0],
  ['water','grass+ground',['grass','ground'],0.25],
];
let pass=0;
for (const [a,t,d,exp] of cases) {
  const got = typeMultiplier(a, d);
  console.log(`${a} vs ${t}: ${got} (esperado ${exp})`, got===exp?'OK':'FAIL');
  if (got===exp) pass++;
}
console.log(`${pass}/${cases.length} pass`);

console.log('\n=== Items totals ===');
const items = Object.values(ITEMS);
const cats = items.reduce((a,i)=>{ a[i.cat]=(a[i.cat]||0)+1; return a; }, {});
console.log('por categoria:', cats);
console.log('total:', items.length);
console.log('TMs:', TMS?.length);

console.log('\n=== Starting bag + money ===');
console.log('money:', STARTING_MONEY);
console.log('bag balls:', STARTING_BAG.balls);
