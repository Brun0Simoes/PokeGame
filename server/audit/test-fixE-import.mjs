function validateSaveShape(s){
  if(!s || typeof s !== 'object') return 'save nao e objeto';
  if(typeof s.version !== 'number') return 'falta save.version (numero)';
  if(!s.trainer || typeof s.trainer !== 'object') return 'falta save.trainer';
  if(typeof s.trainer.name !== 'string' || s.trainer.name.length === 0) return 'save.trainer.name invalido';
  if(typeof s.trainer.money !== 'number' || s.trainer.money < 0) return 'save.trainer.money invalido';
  if(typeof s.trainer.region !== 'string') return 'save.trainer.region invalido';
  if(!Array.isArray(s.party)) return 'save.party nao e array';
  if(s.party.length > 6) return 'save.party maior que 6';
  if(!Array.isArray(s.box)) return 'save.box nao e array';
  if(!s.bag || typeof s.bag !== 'object') return 'save.bag invalido';
  for(const cat of ['balls','medicine','ev','held','mega','zcrystal','tm']){
    if(s.bag[cat] && typeof s.bag[cat] !== 'object') return 'save.bag.'+cat+' invalido';
  }
  if(!s.pokedex || typeof s.pokedex !== 'object') return 'save.pokedex invalido';
  if(!s.pokedex.seen || typeof s.pokedex.seen !== 'object') return 'save.pokedex.seen invalido';
  if(!s.pokedex.caught || typeof s.pokedex.caught !== 'object') return 'save.pokedex.caught invalido';
  if(!s.progress || typeof s.progress !== 'object') return 'save.progress invalido';
  if(!Array.isArray(s.progress.gymsBeaten)) return 'save.progress.gymsBeaten nao e array';
  if(!Array.isArray(s.progress.trainersBeaten)) return 'save.progress.trainersBeaten nao e array';
  for(const m of s.party){
    if(!m || typeof m !== 'object') return 'mon na party invalido';
    if(typeof m.id !== 'number') return 'mon sem id numerico';
    if(typeof m.level !== 'number' || m.level < 1 || m.level > 100) return 'mon level invalido ('+m.level+')';
  }
  return null;
}

const valid = {
  version: 1,
  trainer: { name:'Bruno', money:3000, region:'kanto', id:42, hoursPlayed:0, lastPlayed:0, level:1, exp:0, startedAt:0 },
  party: [{ id:1, level:5, name:'bulbasaur' }],
  box: [],
  bag: { balls:{}, medicine:{}, ev:{}, held:{}, mega:{}, zcrystal:{}, tm:{}, evo:{}, key:[] },
  pokedex: { seen:{}, caught:{} },
  progress: { gymsBeaten:[], trainersBeaten:[], elite4Cleared:false, championBeaten:false, currentGym:0 },
  settings: { music:false, sfx:true, volume:0.5 },
};

console.log('=== Valido ===');
console.log(validateSaveShape(valid));
console.log('PASS:', validateSaveShape(valid) === null ? 'OK' : 'FAIL');

console.log('\n=== Invalid: not object ===');
console.log(validateSaveShape(null));
console.log(validateSaveShape('texto'));

console.log('\n=== Invalid: missing version ===');
const v1 = { ...valid }; delete v1.version;
console.log(validateSaveShape(v1));

console.log('\n=== Invalid: party > 6 ===');
const v2 = { ...valid, party: Array(7).fill({id:1,level:5,name:'x'}) };
console.log(validateSaveShape(v2));

console.log('\n=== Invalid: negative money ===');
const v3 = JSON.parse(JSON.stringify(valid));
v3.trainer.money = -100;
console.log(validateSaveShape(v3));

console.log('\n=== Invalid: mon level 999 ===');
const v4 = JSON.parse(JSON.stringify(valid));
v4.party[0].level = 999;
console.log(validateSaveShape(v4));

console.log('\n=== Invalid: pokedex missing ===');
const v5 = { ...valid }; delete v5.pokedex;
console.log(validateSaveShape(v5));

console.log('\n=== Invalid: mon sem id ===');
const v6 = JSON.parse(JSON.stringify(valid));
v6.party[0] = { level:5, name:'x' };  // sem id
console.log(validateSaveShape(v6));

console.log('\n=== Invalid: progress not array ===');
const v7 = JSON.parse(JSON.stringify(valid));
v7.progress.gymsBeaten = 'not array';
console.log(validateSaveShape(v7));

console.log('\n=== ANTES do fix: aceitava qualquer obj com save.version ===');
const evil = { save: { version:1, /* nothing else */ } };
console.log('Antes: aceitava (Store.setSave dele = save corrompido em runtime)');
console.log('Depois:', validateSaveShape(evil.save));
console.log('PASS:', validateSaveShape(evil.save) !== null ? 'OK' : 'FAIL');
