function capture(maxHp, hp, catchRate, ballBonus, statusBonus) {
  const a = ((3*maxHp - 2*hp) * catchRate * ballBonus * statusBonus) / (3 * maxHp);
  const aC = Math.max(1, Math.min(255, a));
  const chance = 1 - Math.pow(1 - aC/255, 4);
  return Math.max(0.04, Math.min(1.0, chance));
}

console.log('=== Calibracao vs canonical (Bulbapedia) ===');
console.log('Charmander (cr=45) full HP Poke (×1):', (capture(100,100,45,1,1)*100).toFixed(1)+'%', '(canonical ~17%)');
console.log('Charmander 1 HP Poke:                ', (capture(100,1,45,1,1)*100).toFixed(1)+'%', '(canonical ~52%)');
console.log('Charmander 50% HP Great (×1.5):      ', (capture(100,50,45,1.5,1)*100).toFixed(1)+'%');
console.log('Charmander 50% HP Ultra (×2) sleep:  ', (capture(100,50,45,2,2.5)*100).toFixed(1)+'%');
console.log('Mewtwo (cr=3) full HP Ultra:         ', (capture(100,100,3,2,1)*100).toFixed(2)+'%', '(canonical ~0.6%)');
console.log('Mewtwo 1 HP Ultra:                   ', (capture(100,1,3,2,1)*100).toFixed(2)+'%', '(canonical ~3.4%)');
console.log('Mewtwo 1 HP Ultra + sleep:           ', (capture(100,1,3,2,2.5)*100).toFixed(2)+'%', '(canonical ~25%)');

console.log('\n=== Caterpie (cr=255) easy mode ===');
console.log('Full HP Poke:', (capture(100,100,255,1,1)*100).toFixed(1)+'%');
console.log('1 HP Poke:   ', (capture(100,1,255,1,1)*100).toFixed(1)+'%');
