import * as core from '../../js/battle-core.js';

console.log('=== Terrain boost canonical: Gen 7 = 1.5x, Gen 8+ = 1.3x ===');
console.log('codigo:', core.terrainMoveMult('electric','electric',true), '(esperado 1.3 Gen 8+)');
console.log('electric+grass:', core.terrainMoveMult('grass','electric',true), '(esperado 1)');
console.log('grassy+grass:', core.terrainMoveMult('grass','grassy',true), '(esperado 1.3)');
console.log('psychic+psychic:', core.terrainMoveMult('psychic','psychic',true), '(esperado 1.3)');
console.log('misty vs dragon:', core.terrainMoveMult('dragon','misty',true), '(esperado 0.5)');

console.log('\n=== Terrain so afeta grounded ===');
console.log('not grounded:', core.terrainMoveMult('electric','electric',false), '(esperado 1)');

console.log('\n=== isGrounded ===');
console.log('flying type:', core.isGrounded({types:['flying']}), '(esperado false)');
console.log('levitate:', core.isGrounded({types:['ground'], abilities:['levitate']}), '(esperado false)');
console.log('balloon held:', core.isGrounded({types:['fire'], abilities:['blaze'], _heldData:{effect:'airballoon'}}), '(esperado false)');
console.log('normal:', core.isGrounded({types:['normal']}), '(esperado true)');

console.log('\n=== Terrain bloqueia status ===');
console.log('electric+sleep:', core.terrainBlocksStatus('electric','asleep',true), '(esperado true)');
console.log('electric+paralyze:', core.terrainBlocksStatus('electric','paralyzed',true), '(esperado false)');
console.log('misty+poison:', core.terrainBlocksStatus('misty','poisoned',true), '(esperado true)');
console.log('misty+burn:', core.terrainBlocksStatus('misty','burned',true), '(esperado true)');
console.log('grassy+sleep:', core.terrainBlocksStatus('grassy','asleep',true), '(esperado false)');

console.log('\n=== Terrain setters por move ===');
for (const n of ['electric-terrain','grassy-terrain','misty-terrain','psychic-terrain']) {
  console.log(`${n} -> ${core.moveSetsTerrain(n)}`);
}
