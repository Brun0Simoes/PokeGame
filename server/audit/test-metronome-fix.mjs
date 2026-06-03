import { ITEMS } from '../../js/data.js';

// Simula corretamente: lastMove é setado APOS o dano (igual battle.js)
function damageMod(attacker, move, baseDmg) {
  let dmg = baseDmg;
  const hd = attacker._heldData;
  if(hd?.effect==='metronome'){
    if(attacker._lastMove === move.name){
      attacker._metroStacks = Math.min(5, (attacker._metroStacks||0) + 1);
    } else attacker._metroStacks = 0;
    const mult = 1 + 0.2 * attacker._metroStacks;
    if(mult > 1) dmg = Math.floor(dmg * mult);
  }
  attacker._lastMove = move.name;
  return dmg;
}

const move = { name:'flamethrower', type:'fire' };
const a = { _heldData: ITEMS['metronome-item'].held };

console.log('Sequencia de 6 flamethrower:');
for (let i = 1; i <= 6; i++) {
  console.log(`  ${i}ª: ${damageMod(a, move, 100)}, stacks=${a._metroStacks}`);
}
console.log('\nTroca de move:');
console.log(`  ember:    ${damageMod(a, {name:'ember',type:'fire'}, 100)}, stacks=${a._metroStacks} (esperado reset)`);
console.log(`  ember 2x: ${damageMod(a, {name:'ember',type:'fire'}, 100)}, stacks=${a._metroStacks}`);

console.log('\nEsperado: 1ª=100, 2ª=120, 3ª=140, 4ª=160, 5ª=180, 6ª=200 (cap 5 stacks)');
