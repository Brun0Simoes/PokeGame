import * as core from '../../js/battle-core.js';

console.log('=== Mega Charizard X data (canonical) ===');
const d = core.MEGA_DATA[6];
console.log('Espera-se: X tem fire/dragon, Y tem fire/flying');
console.log('X:', d.x);
console.log('Y:', d.y);

console.log('\n=== aplicar boost (simula _doMega) ===');
const mon = { id:6, name:'charizard', stats:{ hp:78, attack:84, defense:78, 'special-attack':109, 'special-defense':85, speed:100 }, types:['fire','flying'] };
// boost: round(x * 1.2)
const before = { ...mon.stats };
for (const k of ['attack','defense','special-attack','special-defense','speed']) {
  mon.stats[k] = Math.round(mon.stats[k] * 1.2);
}
console.log('Charizard pre:', before);
console.log('Charizard pos (codigo: flat 1.2x):', mon.stats);
console.log('Mega Charizard X canonical: atk 130(+46), def 111(+33), spa 130(+21), spd 85(0), spe 100(0)');
console.log('Mega Charizard Y canonical: atk 104(+20), def 78(0), spa 159(+50), spd 115(+30), spe 100(0)');

console.log('\n=== verifica trocas de tipo ===');
const m = { x:'fire/dragon', y:'fire/flying' };
const codeX = d.x?.types?.join('/');
const codeY = d.y?.types?.join('/');
console.log('Mega Char X tipos:', codeX, codeX===m.x?'OK':'FAIL');
console.log('Mega Char Y tipos:', codeY, codeY===m.y?'OK':'FAIL');

console.log('\n=== Mega Gengar canonical: ghost/poison (mantem), atk +65, spa +35 ===');
const g = core.MEGA_DATA[94];
console.log('codigo:', g);
console.log('tipos:', g.types?.join('/'), g.types?.join('/')==='ghost/poison'?'OK':'FAIL');

console.log('\n=== Roster MEGA_DATA cobertura ===');
console.log('Total entradas com types/x/y:', Object.keys(core.MEGA_DATA).length);
console.log('IDs cobertos:', Object.keys(core.MEGA_DATA).join(', '));
console.log('Canonical Mega-capable species: ~50');
