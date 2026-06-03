// Reimplement core fns to avoid importing the audio-tied chain
const MAX = 50;
const trainerExpToReach = (level)=> Math.floor(50*(level-1)*level);
const trainerLevelFromExp = (exp)=>{ let l=1; while(l<MAX && trainerExpToReach(l+1)<=exp) l++; return l; };

console.log('=== Curve ===');
for (const lv of [1,2,5,10,20,30,50]) console.log(`L${lv}: ${trainerExpToReach(lv)} xp`);

console.log('\n=== Total XP needed L1->L50 ===');
console.log(trainerExpToReach(50), '(50 levels)');

console.log('\n=== Reverse ===');
for (const x of [0,100,1000,10000,50000,100000,200000]) {
  console.log(`${x} xp -> L${trainerLevelFromExp(x)}`);
}

console.log('\n=== Reward table ===');
const TRAINER_XP = { winWild:20, catch:45, winNpc:70, winGym:220, winElite:320, winChampion:1200 };
console.log(TRAINER_XP);

console.log('\n=== Quantos winWild precisa para L50? ===');
console.log('XP necessario:', trainerExpToReach(50));
console.log('winWild = 20 → ', Math.ceil(trainerExpToReach(50)/20), 'wild wins');
console.log('catch = 45 → ', Math.ceil(trainerExpToReach(50)/45), 'captures');
console.log('winGym = 220 → ', Math.ceil(trainerExpToReach(50)/220), 'gym wins');

console.log('\n=== encounterParamsFor ===');
const encounterParamsFor = (lv)=>{
  lv = Math.max(1, lv||1);
  const center = Math.min(72, 3+Math.round(lv*1.6));
  return {
    levelMin: Math.max(2, center-3),
    levelMax: Math.min(80, center+4),
    maxEvoStage: lv<12 ? 0 : lv<28 ? 1 : 2,
    rarityBias: Math.max(0, Math.min(0.55, (lv-6)/80)),
  };
};
for (const lv of [1,5,10,12,20,28,35,50]) console.log(`L${lv}:`, encounterParamsFor(lv));
