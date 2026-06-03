import * as core from '../../js/battle-core.js';
import { ITEMS } from '../../js/data.js';

function endOfTurn(mon) {
  const log = [];
  // Flame Orb
  if(mon._heldData?.effect==='flameorb' && (!mon.status || mon.status==='none')){
    const r = core.applyStatus(mon, 'burned');
    if(r.ok) log.push('flame-orb-burn');
  }
  // Toxic Orb
  if(mon._heldData?.effect==='toxicorb' && (!mon.status || mon.status==='none')){
    const r = core.applyStatus(mon, 'poisoned');
    if(r.ok) log.push('toxic-orb-poison');
  }
  // Black Sludge
  if(mon._heldData?.effect==='blacksludge'){
    if((mon.types||[]).includes('poison')){
      if(mon.hp < mon.maxHp){
        mon.hp = Math.min(mon.maxHp, mon.hp + Math.floor(mon.maxHp/16));
        log.push('blacksludge-heal');
      }
    } else {
      mon.hp = Math.max(0, mon.hp - Math.floor(mon.maxHp/8));
      log.push('blacksludge-hurt');
    }
  }
  // Mental Herb
  if(mon._heldData?.effect==='mentalherb' && mon._confused){
    mon._confused = 0;
    mon._heldData = null;
    log.push('mental-herb-cure');
  }
  // Oran Berry
  if(mon._heldData?.effect==='oran' && mon.hp <= mon.maxHp*0.5){
    mon.hp = Math.min(mon.maxHp, mon.hp + 10);
    mon._heldData = null;
    log.push('oran-heal');
  }
  // Lum Berry
  if(mon._heldData?.effect==='lumberry' && mon.status && mon.status!=='none'){
    mon.status = 'none';
    mon._heldData = null;
    log.push('lum-cure');
  }
  return log;
}

console.log('=== Flame Orb auto-burn ===');
const m = { hp:100, maxHp:100, status:'none', types:['normal'], _heldData: ITEMS['flame-orb'].held };
const r = endOfTurn(m);
console.log(r, 'status:', m.status);
console.log('PASS:', r.includes('flame-orb-burn') && m.status === 'burned' ? 'OK' : 'FAIL');

console.log('\n=== Toxic Orb auto-poison ===');
const m2 = { hp:100, maxHp:100, status:'none', types:['normal'], _heldData: ITEMS['toxic-orb'].held };
const r2 = endOfTurn(m2);
console.log(r2, 'status:', m2.status);
console.log('PASS:', m2.status === 'poisoned' ? 'OK' : 'FAIL');

console.log('\n=== Flame Orb não burn em fire-type ===');
const m3 = { hp:100, maxHp:100, status:'none', types:['fire'], _heldData: ITEMS['flame-orb'].held };
endOfTurn(m3);
console.log('status:', m3.status, '(esperado none — applyStatus rejeita fire vs burn)');

console.log('\n=== Black Sludge: cura poison-type ===');
const m4 = { hp:50, maxHp:100, status:'none', types:['poison'], _heldData: ITEMS['leftovers-2'].held };
const r4 = endOfTurn(m4);
console.log(r4, 'hp:', m4.hp);
console.log('PASS:', m4.hp === 56 && r4.includes('blacksludge-heal') ? 'OK' : 'FAIL');

console.log('\n=== Black Sludge: fere normal-type ===');
const m5 = { hp:100, maxHp:100, status:'none', types:['normal'], _heldData: ITEMS['leftovers-2'].held };
endOfTurn(m5);
console.log('hp:', m5.hp, '(esperado 88, -12 = 1/8)');
console.log('PASS:', m5.hp === 88 ? 'OK' : 'FAIL');

console.log('\n=== Mental Herb cura confusão ===');
const m6 = { _confused: 3, _heldData: ITEMS['mental-herb'].held };
endOfTurn(m6);
console.log('confused:', m6._confused, 'held:', m6._heldData);
console.log('PASS:', m6._confused === 0 && m6._heldData === null ? 'OK' : 'FAIL');

console.log('\n=== Oran Berry: +10 quando <= 50% ===');
const m7 = { hp:40, maxHp:100, status:'none', types:[], _heldData: ITEMS['oran-berry'].held };
endOfTurn(m7);
console.log('hp:', m7.hp, '(esperado 50)');
console.log('PASS:', m7.hp === 50 && m7._heldData === null ? 'OK' : 'FAIL');

console.log('\n=== Oran NÃO procar se HP > 50% ===');
const m8 = { hp:60, maxHp:100, status:'none', types:[], _heldData: ITEMS['oran-berry'].held };
endOfTurn(m8);
console.log('hp:', m8.hp, '(esperado 60)');
console.log('PASS:', m8.hp === 60 ? 'OK' : 'FAIL');

console.log('\n=== Lum Berry cura status ===');
const m9 = { hp:50, maxHp:100, status:'paralyzed', types:[], _heldData: ITEMS['lum-berry'].held };
endOfTurn(m9);
console.log('status:', m9.status, 'held:', m9._heldData);
console.log('PASS:', m9.status === 'none' && m9._heldData === null ? 'OK' : 'FAIL');
