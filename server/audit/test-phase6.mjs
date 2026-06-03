import { Z_SIGNATURE, zSignatureFor } from '../../js/battle-core.js';

console.log('=== Z_SIGNATURE roster ===');
console.log(Object.keys(Z_SIGNATURE).length, 'assinaturas');
for (const [id, sig] of Object.entries(Z_SIGNATURE)) {
  console.log(`  Pokémon ${id}: ${sig.name} (BP ${sig.basePower}, ${sig.type})`);
}

console.log('\n=== zSignatureFor: Pikachu com Pikanium Z ===');
const r1 = zSignatureFor(25, 25);
console.log(r1, '(esperado Catastropika)');
console.log('PASS:', r1?.name === 'Catastropika' ? 'OK' : 'FAIL');

console.log('\n=== Pikachu com Z genérico (sem signature) ===');
const r2 = zSignatureFor(25, null);
console.log(r2, '(esperado null — cai em Z normal)');
console.log('PASS:', r2 === null ? 'OK' : 'FAIL');

console.log('\n=== Charizard com Pikanium Z (assinatura nao casa) ===');
const r3 = zSignatureFor(6, 25);
console.log(r3, '(esperado null)');
console.log('PASS:', r3 === null ? 'OK' : 'FAIL');

console.log('\n=== Eevee com Eevium = Extreme Evoboost (status move, +2 all stats) ===');
const r4 = zSignatureFor(133, 133);
console.log(r4);
console.log('PASS:', r4?.name === 'Extreme Evoboost' && r4.effect.kind === 'allStatsUp' ? 'OK' : 'FAIL');

console.log('\n=== Mew com Mewnium = Genesis Supernova (seta psychic terrain) ===');
const r5 = zSignatureFor(151, 151);
console.log(r5);
console.log('PASS:', r5?.effect?.kind === 'terrain' && r5.effect.value === 'psychic' ? 'OK' : 'FAIL');

console.log('\n=== Trade evolution tests ===');
// Simulacao da logica de canEvolveByTrade — sem ir na PokeAPI
function canEvolveByTradeLogic(nxt, held){
  if(!nxt || nxt.trigger !== 'trade') return null;
  if(nxt.item){
    if(held && held === nxt.item) return nxt;
    return null;
  }
  return nxt;
}

console.log('\nSlowpoke + King\'s Rock = Slowking:');
const r6 = canEvolveByTradeLogic({trigger:'trade', item:'kings-rock', name:'slowking'}, 'kings-rock');
console.log(r6, '(esperado evolui)');
console.log('PASS:', r6?.name === 'slowking' ? 'OK' : 'FAIL');

console.log('\nSlowpoke SEM King\'s Rock = NAO evolui:');
const r7 = canEvolveByTradeLogic({trigger:'trade', item:'kings-rock', name:'slowking'}, null);
console.log(r7, '(esperado null)');
console.log('PASS:', r7 === null ? 'OK' : 'FAIL');

console.log('\nMachoke trade simples (sem item) = Machamp:');
const r8 = canEvolveByTradeLogic({trigger:'trade', name:'machamp'}, null);
console.log(r8, '(esperado evolui)');
console.log('PASS:', r8?.name === 'machamp' ? 'OK' : 'FAIL');

console.log('\nOnix + Metal Coat = Steelix:');
const r9 = canEvolveByTradeLogic({trigger:'trade', item:'metal-coat', name:'steelix'}, 'metal-coat');
console.log(r9);
console.log('PASS:', r9?.name === 'steelix' ? 'OK' : 'FAIL');
