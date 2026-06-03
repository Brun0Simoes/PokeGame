import * as core from '../../js/battle-core.js';
import { api, fetchMove, learnableMoves, moveShape } from '../../js/api.js';

console.log('=== Charge moves table ===');
const charges = ['solar-beam','fly','dig','dive','sky-attack','phantom-force','shadow-force','geomancy'];
for (const m of charges) {
  console.log(`${m} isCharge:`, core.isChargeMove(m));
}
console.log('non-charge tackle:', core.isChargeMove('tackle'), '(esperado false)');

console.log('\n=== Solar Beam pula recarga no sol ===');
console.log('solar-beam+sun:', core.chargeSkippedByWeather('solar-beam','sun'), '(esperado true)');
console.log('solar-beam+rain:', core.chargeSkippedByWeather('solar-beam','rain'), '(esperado false)');
console.log('fly+sun:', core.chargeSkippedByWeather('fly','sun'), '(esperado false)');

console.log('\n=== makesContact ===');
console.log('tackle:', core.makesContact({name:'tackle', damage_class:'physical'}), '(esperado true)');
console.log('earthquake:', core.makesContact({name:'earthquake', damage_class:'physical'}), '(esperado false)');
console.log('flamethrower (spec):', core.makesContact({name:'flamethrower', damage_class:'special'}), '(esperado false)');

console.log('\n=== Live fetch from PokéAPI ===');
console.log('Buscando tackle...');
try {
  const t = await fetchMove('tackle');
  console.log('tackle:', {name:t?.name, type:t?.type, power:t?.power, accuracy:t?.accuracy, damage_class:t?.damage_class, pp:t?.pp, maxPp:t?.maxPp});
} catch(e) { console.log('fail:', e.message); }
