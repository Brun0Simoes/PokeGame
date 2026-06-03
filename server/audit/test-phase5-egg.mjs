import { compatible } from '../../js/breeding.js';

console.log('=== Pikachu (fairy/field) + Wigglytuff (fairy) — devem bater ===');
console.log('AGORA:', await compatible({uid:1,id:25}, {uid:2,id:40}));

console.log('\n=== Bulbasaur (monster/grass) + Charmander (monster/dragon) — devem bater (monster) ===');
console.log('AGORA:', await compatible({uid:1,id:1}, {uid:2,id:4}));

console.log('\n=== Ditto (ditto) + qualquer = bate ===');
console.log('Ditto + Charizard:', await compatible({uid:1,id:132}, {uid:2,id:6}));
console.log('Ditto + Pikachu:', await compatible({uid:1,id:132}, {uid:2,id:25}));

console.log('\n=== Mewtwo (no-eggs) + Ditto = NAO bate ===');
console.log('Mewtwo + Ditto:', await compatible({uid:1,id:150}, {uid:2,id:132}), '(esperado false — lendário)');

console.log('\n=== Mewtwo + Mew = NAO bate ===');
console.log(await compatible({uid:1,id:150}, {uid:2,id:151}), '(esperado false)');

console.log('\n=== Mesmo mon (uid) NAO bate ===');
console.log(await compatible({uid:1,id:25}, {uid:1,id:25}), '(esperado false)');

console.log('\n=== Pokémon de tipos diferentes mas mesmo egg group (Magnemite + Rotom = mineral) ===');
console.log('Magnemite + Rotom:', await compatible({uid:1,id:81}, {uid:2,id:479}));

console.log('\n=== Gyarados (water2/dragon) + Caterpie (bug) — NAO bate ===');
console.log(await compatible({uid:1,id:130}, {uid:2,id:10}), '(esperado false)');
