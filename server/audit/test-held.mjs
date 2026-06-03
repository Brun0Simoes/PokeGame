import * as core from '../../js/battle-core.js';
import { ITEMS } from '../../js/data.js';

const items = Object.entries(ITEMS).filter(([id,v]) => v.cat==='held');
console.log(`Total held items: ${items.length}`);

const effects = new Set(items.map(([,v])=>v.held?.effect).filter(Boolean));
console.log(`Distinct effects: ${effects.size}`);
console.log([...effects].sort().join(', '));

console.log('\n=== Sample stat boost via effStat (Choice Band ATK 1.5x) ===');
const cb = ITEMS['choice-band'];
const m = { stats:{attack:100}, status:'none', _stages:{}, _heldData: cb.held };
console.log('atk com choice-band:', core.effStat(m,'attack'), '(esperado 150)');

const ls = ITEMS['choice-specs'];
const m2 = { stats:{'special-attack':100}, status:'none', _stages:{}, _heldData: ls.held };
console.log('spa com choice-specs:', core.effStat(m2,'special-attack'), '(esperado 150)');

const cs = ITEMS['choice-scarf'];
const m3 = { stats:{speed:100}, status:'none', _stages:{}, _heldData: cs.held };
console.log('spe com choice-scarf:', core.effStat(m3,'speed'), '(esperado 150)');

const av = ITEMS['assault-vest'];
const m4 = { stats:{'special-defense':100}, status:'none', _stages:{}, _heldData: av.held };
console.log('spd com assault-vest:', core.effStat(m4,'special-defense'), '(esperado 150)');

console.log('\n=== Implementacao no engine (procurar por effect tags) ===');
// O resto dos efeitos é processado em battle.js, nao em battle-core.js
// Vamos listar quais effect tags o engine REALMENTE consome
