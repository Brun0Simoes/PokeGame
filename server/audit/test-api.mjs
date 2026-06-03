import { api, makeMon, fetchMove, learnableMoves } from '../../js/api.js';

console.log('=== getPokemon live ===');
const c = await api.getPokemon(6); // Charizard
console.log('id:', c?.id, 'name:', c?.name, 'types:', c?.types?.map(t=>t.type.name));

console.log('\n=== getEvolutionPath ===');
const path = await api.getEvolutionPath(1); // Bulbasaur chain
console.log('Bulb path:', path?.map(p=>p.name));

console.log('\n=== getRandomEncounter ===');
const r = await api.getRandomEncounter({ regionId: 'kanto', rarityBias: 0 });
console.log('random kanto:', r?.name);

console.log('\n=== getBestSprite ===');
const s1 = api.getBestSprite(c, 'showdown', false);
const s2 = api.getBestSprite(c, 'showdown', true);
console.log('showdown:', s1 ? 'OK' : 'FAIL');
console.log('shiny:', s2 ? 'OK' : 'FAIL');

console.log('\n=== makeMon end-to-end ===');
const m = await makeMon({ speciesIdOrName: 25, level: 25, source:'wild' });
if (m) {
  console.log('Pikachu Lv25:');
  console.log('  name:', m.name, 'level:', m.level);
  console.log('  types:', m.types);
  console.log('  HP:', m.hp+'/'+m.maxHp);
  console.log('  stats:', m.stats);
  console.log('  moves:', m.moves?.map(mv=>mv.name).join(', '));
  console.log('  abilities:', m.abilities);
  console.log('  nature:', m.nature, '  IVs:', m.ivs);
  console.log('  uid:', m.uid);
  console.log('  ball:', m.ball);
}

console.log('\n=== learnableMoves ===');
const lm = await learnableMoves(25, 30);
console.log('Pikachu @ Lv30 learnable count:', lm?.length);

console.log('\n=== fetchMove edge case: unknown move ===');
try {
  const um = await fetchMove('totally-fake-move-999');
  console.log('unknown:', um);
} catch (e) { console.log('error:', e.message); }
