// Replica formula canonical
function captureChance(maxHp, hp, catchRate, ballMult, statusBonus, ballTag, ctx) {
  if (ballTag === 'master' || ballMult >= 255) return { chance:1, master:true };
  let ballBonus = ballMult;
  if (ballTag === 'water/bug' && ctx.types?.some(t=>t==='water'||t==='bug')) ballBonus = 3.5;
  else if (ballTag === 'water' && ctx.types?.includes('water')) ballBonus = 3.5;
  else if (ballTag === 'firstturn' && ctx.attempts === 0) ballBonus = 5;
  else if (ballTag === 'sleep' && ctx.status === 'asleep') ballBonus = 4;
  else if (ballTag === 'caught' && ctx.alreadyCaught) ballBonus = 3;
  else if (ballTag === 'lowlevel') ballBonus = Math.max(1, Math.min(4, (41 - (ctx.level||1)) / 10));
  
  const a = ((3*maxHp - 2*hp) * catchRate * ballBonus * statusBonus) / (3 * maxHp);
  const chance = Math.max(0.04, Math.min(1.0, a / 255));
  return { chance, a };
}

console.log('=== Charmander (catch 45) full HP, Poké, no status ===');
let r = captureChance(100, 100, 45, 1.0, 1.0, null, {});
console.log(`chance: ${(r.chance*100).toFixed(1)}% (canonical 17%)`);

console.log('\n=== Charmander 1 HP, Poké, no status ===');
r = captureChance(100, 1, 45, 1.0, 1.0, null, {});
console.log(`chance: ${(r.chance*100).toFixed(1)}% (canonical 51%)`);

console.log('\n=== Charmander 50% HP, Ultra (×2), paralyzed (×1.5) ===');
r = captureChance(100, 50, 45, 2.0, 1.5, null, {});
console.log(`chance: ${(r.chance*100).toFixed(1)}%`);

console.log('\n=== Mewtwo (catch 3) - lendário ===');
r = captureChance(100, 1, 3, 2.0, 1.0, null, {});
console.log(`Ultra Ball, 1 HP: ${(r.chance*100).toFixed(2)}% (canonical ~3.4%)`);

r = captureChance(100, 1, 3, 4.0, 2.5, null, { status:'asleep' });
console.log(`Ultra Ball, 1 HP, sleep: ${(r.chance*100).toFixed(2)}% (canonical ~25%)`);

console.log('\n=== Master Ball Mewtwo full HP ===');
r = captureChance(100, 100, 3, 255, 1.0, 'master', {});
console.log(`master: ${r.chance*100}% (esperado 100%)`);

console.log('\n=== Net Ball vs Water type ===');
r = captureChance(100, 50, 100, 3.0, 1.0, 'water/bug', { types:['water'] });
console.log(`Net+water (50%HP): ${(r.chance*100).toFixed(1)}% (bonus ×3.5)`);
r = captureChance(100, 50, 100, 3.0, 1.0, 'water/bug', { types:['normal'] });
console.log(`Net+normal (50%HP): ${(r.chance*100).toFixed(1)}% (bonus ×3 só)`);

console.log('\n=== Quick Ball turno 1 vs turno 2 ===');
r = captureChance(100, 100, 100, 4.0, 1.0, 'firstturn', { attempts:0 });
console.log(`Quick (turn 1): ${(r.chance*100).toFixed(1)}% (×5)`);
r = captureChance(100, 100, 100, 4.0, 1.0, 'firstturn', { attempts:1 });
console.log(`Quick (turn 2): ${(r.chance*100).toFixed(1)}% (×4)`);

console.log('\n=== Dream Ball vs sleeping ===');
r = captureChance(100, 100, 100, 4.0, 2.5, 'sleep', { status:'asleep' });
console.log(`Dream+sleep: ${(r.chance*100).toFixed(1)}% (×4 + status×2.5)`);

console.log('\n=== Repeat Ball ===');
r = captureChance(100, 50, 100, 3.0, 1.0, 'caught', { alreadyCaught:true });
console.log(`Repeat (já caught): ${(r.chance*100).toFixed(1)}% (×3)`);
r = captureChance(100, 50, 100, 3.0, 1.0, 'caught', { alreadyCaught:false });
console.log(`Repeat (não caught): ${(r.chance*100).toFixed(1)}% (×3 default)`);

console.log('\n=== Nest Ball: bonus depende de level ===');
r = captureChance(100, 100, 100, 2.5, 1.0, 'lowlevel', { level:5 });
console.log(`Nest Lv5: ${(r.chance*100).toFixed(1)}% (×3.6)`);
r = captureChance(100, 100, 100, 2.5, 1.0, 'lowlevel', { level:30 });
console.log(`Nest Lv30: ${(r.chance*100).toFixed(1)}% (×1.1)`);
r = captureChance(100, 100, 100, 2.5, 1.0, 'lowlevel', { level:60 });
console.log(`Nest Lv60: ${(r.chance*100).toFixed(1)}% (×1 - clamped)`);
