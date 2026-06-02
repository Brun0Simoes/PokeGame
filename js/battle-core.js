/* ============================================================
   battle-core.js — deep battle mechanics
   Stat stages, status conditions, weather, crit, held items,
   Z-moves (full table), Max/G-Max moves, Mega data.
   Pure functions + small helpers; the engine in battle.js calls these.
   ============================================================ */

import { typeMultiplier, TYPE_COLOR } from './data.js';

/* ---------- Stat stages (-6..+6) ---------- */
export const STAGE_MULT = { '-6':0.25,'-5':0.285,'-4':0.33,'-3':0.4,'-2':0.5,'-1':0.66,'0':1,'1':1.5,'2':2,'3':2.5,'4':3,'5':3.5,'6':4 };
export const ACC_STAGE_MULT = { '-6':0.33,'-5':0.375,'-4':0.428,'-3':0.5,'-2':0.6,'-1':0.75,'0':1,'1':1.33,'2':1.66,'3':2,'4':2.33,'5':2.66,'6':3 };

export function freshStages(){
  return { attack:0, defense:0, 'special-attack':0, 'special-defense':0, speed:0, accuracy:0, evasion:0 };
}
export function stageMult(stage){ return STAGE_MULT[String(Math.max(-6,Math.min(6,stage)))]; }
export function accMult(stage){ return ACC_STAGE_MULT[String(Math.max(-6,Math.min(6,stage)))]; }

/* effective combat stat including stage + status + held + mega */
export function effStat(mon, key){
  let v = mon.stats[key] || 1;
  const st = mon._stages?.[key] || 0;
  v = Math.floor(v * stageMult(st));
  // burn halves physical attack
  if(key === 'attack' && mon.status === 'burned') v = Math.floor(v * 0.5);
  // paralysis halves speed
  if(key === 'speed' && mon.status === 'paralyzed') v = Math.floor(v * 0.5);
  // held item stat boosts
  const held = mon._heldData;
  if(held){
    if(held.effect==='atk' && key==='attack') v = Math.floor(v*held.mult);
    if(held.effect==='spa' && key==='special-attack') v = Math.floor(v*held.mult);
    if(held.effect==='spe' && key==='speed') v = Math.floor(v*held.mult);
    if(held.effect==='spd' && key==='special-defense') v = Math.floor(v*held.mult);
  }
  return Math.max(1, v);
}

/* ---------- Status conditions ---------- */
export function statusShort(s){
  return ({ poisoned:'ENV', burned:'QUE', paralyzed:'PAR', asleep:'SON', frozen:'CON' })[s] || '';
}
export function statusName(s){
  return ({ poisoned:'envenenado', burned:'queimado', paralyzed:'paralisado', asleep:'dormindo', frozen:'congelado' })[s] || '';
}
export function statusColor(s){
  return ({ poisoned:'#A33EA1', burned:'#EE8130', paralyzed:'#F7D02C', asleep:'#888', frozen:'#96D9D6' })[s] || '#888';
}

/* Can this mon act this turn? returns { canAct, message, cured } */
export function preMoveStatus(mon){
  if(mon.status === 'frozen'){
    if(Math.random() < 0.2){ mon.status='none'; return { canAct:true, message:`${disp(mon)} descongelou!` }; }
    return { canAct:false, message:`${disp(mon)} está congelado!` };
  }
  if(mon.status === 'asleep'){
    mon._sleepTurns = (mon._sleepTurns ?? (1+Math.floor(Math.random()*3)));
    mon._sleepTurns--;
    if(mon._sleepTurns <= 0){ mon.status='none'; return { canAct:true, message:`${disp(mon)} acordou!` }; }
    return { canAct:false, message:`${disp(mon)} está dormindo profundamente.` };
  }
  if(mon.status === 'paralyzed'){
    if(Math.random() < 0.25) return { canAct:false, message:`${disp(mon)} está paralisado! Não consegue se mexer!` };
  }
  return { canAct:true };
}

/* End-of-turn residual damage. returns array of {message, dmg} */
export function endOfTurnStatus(mon){
  const events = [];
  if(mon.hp <= 0) return events;
  if(mon.status === 'poisoned'){
    const dmg = Math.max(1, Math.floor(mon.maxHp/8));
    mon.hp = Math.max(0, mon.hp - dmg);
    events.push({ message:`${disp(mon)} sofreu com o veneno!`, dmg });
  }
  if(mon.status === 'burned'){
    const dmg = Math.max(1, Math.floor(mon.maxHp/16));
    mon.hp = Math.max(0, mon.hp - dmg);
    events.push({ message:`${disp(mon)} sofreu com a queimadura!`, dmg });
  }
  return events;
}

function disp(mon){ return (mon.nickname || mon.name).toUpperCase(); }

/* Apply a status to a target (respects immunity & existing status) */
export function applyStatus(target, status){
  if(target.status && target.status !== 'none') return { ok:false };
  // type immunities
  const t = target.types || [];
  if(status==='burned' && t.includes('fire')) return { ok:false };
  if((status==='poisoned') && (t.includes('poison')||t.includes('steel'))) return { ok:false };
  if(status==='paralyzed' && t.includes('electric')) return { ok:false };
  if(status==='frozen' && t.includes('ice')) return { ok:false };
  target.status = status;
  if(status==='asleep') target._sleepTurns = 1+Math.floor(Math.random()*3);
  return { ok:true };
}

/* ---------- Weather ---------- */
export const WEATHER = { none:'Sem clima', rain:'Chuva', sun:'Sol Forte', sandstorm:'Tempestade de Areia', hail:'Granizo' };
export function weatherDamageMult(moveType, weather){
  if(weather==='rain'){ if(moveType==='water') return 1.5; if(moveType==='fire') return 0.5; }
  if(weather==='sun'){ if(moveType==='fire') return 1.5; if(moveType==='water') return 0.5; }
  return 1;
}

/* ---------- Critical hits ---------- */
export function rollCrit(stage=0){
  const odds = [1/24, 1/8, 1/2, 1, 1][Math.min(4, stage)];
  return Math.random() < odds;
}

/* ---------- Z-Move power table ---------- */
export function zPower(basePower){
  if(basePower <= 55) return 100;
  if(basePower <= 65) return 120;
  if(basePower <= 75) return 140;
  if(basePower <= 85) return 160;
  if(basePower <= 95) return 175;
  if(basePower <= 100) return 180;
  if(basePower <= 110) return 185;
  if(basePower <= 125) return 190;
  if(basePower <= 130) return 195;
  return 200;
}
/* Status Z-moves grant a side benefit instead of damage */
export function zStatusEffect(moveType){
  // returns { stat, stages } buff applied to the user
  const map = {
    normal:{ stat:'all', stages:1 }, fighting:{ stat:'attack', stages:1 }, flying:{ stat:'speed', stages:1 },
    poison:{ stat:'defense', stages:1 }, ground:{ stat:'special-defense', stages:1 }, rock:{ stat:'defense', stages:1 },
    bug:{ stat:'special-attack', stages:1 }, ghost:{ stat:'attack', stages:1 }, steel:{ stat:'defense', stages:1 },
    fire:{ stat:'attack', stages:1 }, water:{ stat:'attack', stages:1 }, grass:{ stat:'attack', stages:1 },
    electric:{ stat:'speed', stages:1 }, psychic:{ stat:'special-attack', stages:1 }, ice:{ stat:'special-defense', stages:1 },
    dragon:{ stat:'attack', stages:1 }, dark:{ stat:'evasion', stages:1 }, fairy:{ stat:'special-defense', stages:1 },
  };
  return map[moveType] || { stat:'attack', stages:1 };
}
export function zMoveName(moveType){
  return ({
    normal:'Explosão Devastadora', fire:'Inferno Total', water:'Hidrovórtice Catastrófico',
    electric:'Gigavolt Fulminante', grass:'Florescer Selvagem', ice:'Geleira Subzero',
    fighting:'Soco Marcial Total', poison:'Ácido Letal', ground:'Cataclismo Telúrico',
    flying:'Aerofúria Suprema', psychic:'Disrupção Psíquica', bug:'Enxame Devastador',
    rock:'Litóclise Contínua', ghost:'Espectro Aterrorizante', dragon:'Dracoritmo Devastador',
    dark:'Covil das Trevas', steel:'Ferromáquina Demolidora', fairy:'Estrela Cintilante',
  })[moveType] || 'Movimento Z';
}

/* ---------- Max / G-Max moves ---------- */
export function maxMoveName(moveType, isGmax){
  const max = {
    normal:'Maxitaque', fire:'Maxincêndio', water:'Maxidúvio', electric:'Maxiraio',
    grass:'Maxiflora', ice:'Maxigélido', fighting:'Maxinocaute', poison:'Maxitóxico',
    ground:'Maxiquake', flying:'Maxiventania', psychic:'Maxipsíquico', bug:'Maxinseto',
    rock:'Maxirrocha', ghost:'Maxiespectro', dragon:'Maxidracon', dark:'Maxitrevas',
    steel:'Maxiaço', fairy:'Maxifada',
  };
  return (isGmax?'G-':'') + (max[moveType] || 'Maximgolpe');
}
/* Max moves apply a side effect (weather or stat change) */
export function maxMoveEffect(moveType){
  const map = {
    fire:{ kind:'weather', value:'sun' }, water:{ kind:'weather', value:'rain' },
    rock:{ kind:'weather', value:'sandstorm' }, ice:{ kind:'weather', value:'hail' },
    grass:{ kind:'enemyStat', stat:'special-attack', stages:-1 },
    fighting:{ kind:'selfStat', stat:'attack', stages:1 },
    poison:{ kind:'enemyStat', stat:'special-defense', stages:-1 },
    ground:{ kind:'enemyStat', stat:'speed', stages:-1 },
    flying:{ kind:'selfStat', stat:'speed', stages:1 },
    psychic:{ kind:'selfStat', stat:'special-attack', stages:1 },
    bug:{ kind:'enemyStat', stat:'special-attack', stages:-1 },
    ghost:{ kind:'enemyStat', stat:'defense', stages:-1 },
    dragon:{ kind:'selfStat', stat:'attack', stages:1 },
    dark:{ kind:'enemyStat', stat:'defense', stages:-1 },
    steel:{ kind:'selfStat', stat:'defense', stages:1 },
    electric:{ kind:'selfStat', stat:'speed', stages:1 },
    normal:{ kind:'selfStat', stat:'attack', stages:1 },
    fairy:{ kind:'selfStat', stat:'special-defense', stages:1 },
  };
  return map[moveType] || null;
}
export function maxBasePower(basePower){
  if(basePower<=40) return 90;
  if(basePower<=50) return 100;
  if(basePower<=60) return 110;
  if(basePower<=70) return 120;
  if(basePower<=100) return 130;
  if(basePower<=140) return 140;
  return 150;
}

/* ---------- Mega evolution data ---------- */
/* megaFor speciesId -> { name, types?, statBoost: {stat:+x}, sprite? } */
export const MEGA_DATA = {
  6:  { x:{ name:'Mega Charizard X', types:['fire','dragon'] }, y:{ name:'Mega Charizard Y', types:['fire','flying'] } },
  3:  { name:'Mega Venusaur', types:['grass','poison'] },
  9:  { name:'Mega Blastoise', types:['water'] },
  257:{ name:'Mega Blaziken', types:['fire','fighting'] },
  448:{ name:'Mega Lucario', types:['fighting','steel'] },
  282:{ name:'Mega Gardevoir', types:['psychic','fairy'] },
  94: { name:'Mega Gengar', types:['ghost','poison'] },
  65: { name:'Mega Alakazam', types:['psychic'] },
  150:{ name:'Mega Mewtwo X', types:['psychic','fighting'] },
  376:{ name:'Mega Metagross', types:['steel','psychic'] },
  373:{ name:'Mega Salamence', types:['dragon','flying'] },
};

/* Whether move makes contact (for Rocky Helmet / Life Orb interactions) */
export function makesContact(move){
  return move.damage_class === 'physical' && !['earthquake','rock-slide','flash-cannon','air-slash'].includes(move.name);
}

/* ---------- Terrain ---------- */
export const TERRAIN = { none:'Sem terreno', electric:'Campo Elétrico', grassy:'Campo de Grama', misty:'Campo de Névoa', psychic:'Campo Psíquico' };
export function terrainMoveMult(moveType, terrain, attackerGrounded){
  if(!attackerGrounded) return 1;
  if(terrain==='electric' && moveType==='electric') return 1.3;
  if(terrain==='grassy'   && moveType==='grass')    return 1.3;
  if(terrain==='psychic'  && moveType==='psychic')  return 1.3;
  if(terrain==='misty'    && moveType==='dragon')   return 0.5;
  return 1;
}
/* terrain that blocks a status on grounded mons */
export function terrainBlocksStatus(terrain, status, grounded){
  if(!grounded) return false;
  if(terrain==='electric' && status==='asleep') return true;
  if(terrain==='misty' && ['poisoned','burned','paralyzed','frozen','asleep'].includes(status)) return true;
  return false;
}
export function isGrounded(mon){
  const a = activeAbility(mon);
  if(a === 'levitate') return false;
  if((mon.types||[]).includes('flying')) return false;
  if(mon._heldData?.effect === 'airballoon') return false;
  return true;
}
/* which move name sets which terrain */
export function moveSetsTerrain(name){
  return ({ 'electric-terrain':'electric', 'grassy-terrain':'grassy', 'misty-terrain':'misty', 'psychic-terrain':'psychic' })[name] || null;
}

/* ---------- Screens (side barriers) ---------- */
/* a side state object: { reflect:turns, lightscreen:turns, hazards:{stealthrock,spikes} } */
export function freshSide(){ return { reflect:0, lightscreen:0, auroraveil:0, stealthrock:false, spikes:0, toxicspikes:0 }; }
export function moveSetsScreen(name){
  return ({ 'reflect':'reflect', 'light-screen':'lightscreen', 'aurora-veil':'auroraveil' })[name] || null;
}
export function screenMult(side, move){
  if(!side) return 1;
  if(move.damage_class==='physical' && (side.reflect>0 || side.auroraveil>0)) return 0.5;
  if(move.damage_class==='special'  && (side.lightscreen>0 || side.auroraveil>0)) return 0.5;
  return 1;
}
export function moveSetsHazard(name){
  return ({ 'stealth-rock':'stealthrock', 'spikes':'spikes', 'toxic-spikes':'toxicspikes' })[name] || null;
}
/* hazard damage on switch-in. returns { dmg, message, status } */
export function hazardOnEntry(side, mon){
  const out = [];
  if(side.stealthrock){
    const eff = typeMultiplier('rock', mon.types||[]);
    const frac = (1/8) * eff; // scaled by rock effectiveness
    const dmg = Math.max(1, Math.floor(mon.maxHp * frac));
    out.push({ dmg, message:`Pedras pontiagudas feriram ${(mon.nickname||mon.name).toUpperCase()}!` });
  }
  if(side.spikes>0 && isGrounded(mon)){
    const frac = [0,1/8,1/6,1/4][Math.min(3,side.spikes)];
    const dmg = Math.max(1, Math.floor(mon.maxHp * frac));
    out.push({ dmg, message:`Espinhos feriram ${(mon.nickname||mon.name).toUpperCase()}!` });
  }
  if(side.toxicspikes>0 && isGrounded(mon) && !(mon.types||[]).includes('poison')){
    out.push({ dmg:0, status:'poisoned', message:`${(mon.nickname||mon.name).toUpperCase()} foi envenenado pelos espinhos tóxicos!` });
  }
  return out;
}

/* ---------- Two-turn (charge) moves ---------- */
export const CHARGE_MOVES = {
  'solar-beam': 'absorveu luz solar!', 'fly':'voou para o alto!', 'dig':'cavou um buraco!',
  'dive':'mergulhou!', 'razor-wind':'criou um redemoinho!', 'skull-bash':'baixou a cabeça!',
  'sky-attack':'concentrou energia!', 'freeze-shock':'liberou energia gelada!',
  'ice-burn':'liberou energia congelante!', 'phantom-force':'desapareceu!', 'shadow-force':'desapareceu!',
  'bounce':'saltou bem alto!', 'geomancy':'absorveu energia!',
};
export function isChargeMove(name){ return !!CHARGE_MOVES[name]; }
/* moves that get full power with no charge under sun (Solar Beam) */
export function chargeSkippedByWeather(name, weather){ return name==='solar-beam' && weather==='sun'; }

/* ---------- Priority ---------- */
export function movePriority(move){
  if(move.priority != null && move.priority !== 0) return move.priority;
  const P = { 'quick-attack':1,'aqua-jet':1,'bullet-punch':1,'mach-punch':1,'ice-shard':1,'shadow-sneak':1,
    'extreme-speed':2,'fake-out':3,'protect':4,'detect':4,'sucker-punch':1,'vacuum-wave':1,'feint':2,'first-impression':2 };
  return P[move.name] || 0;
}

/* ---------- Confusion ---------- */
export function applyConfusion(mon){
  if(mon._confused) return false;
  mon._confused = 2 + Math.floor(Math.random()*3); // 2-4 turns
  return true;
}
/* returns { hitsSelf, cleared } */
export function tickConfusion(mon){
  if(!mon._confused) return { hitsSelf:false, cleared:false };
  mon._confused--;
  if(mon._confused <= 0){ mon._confused = 0; return { hitsSelf:false, cleared:true }; }
  return { hitsSelf: Math.random() < 1/3, cleared:false };
}

/* ---------- Extended ability set (broadened) ---------- */
export const ABILITY_EXTRA_PT = {
  'wonder-guard':'Guarda Maravilha','marvel-scale':'Escama Mágica','multiscale':'Multiescala',
  'regenerator':'Regenerador','natural-cure':'Cura Natural','poison-heal':'Cura Venenosa',
  'magic-bounce':'Reflexo Mágico','clear-body':'Corpo Limpo','unaware':'Alheio','moxie':'Soberba',
  'technician':'Técnico','adaptability':'Adaptabilidade','tinted-lens':'Lente Tingida',
  'solar-power':'Poder Solar','chlorophyll':'Clorofila','swift-swim':'Nado Rápido','sand-rush':'Corrida na Areia',
  'slush-rush':'Corrida na Neve','water-veil':'Véu de Água','immunity':'Imunidade','limber':'Flexível',
  'insomnia':'Insônia','vital-spirit':'Espírito Vital','own-tempo':'Ritmo Próprio','inner-focus':'Foco Interno',
};
/* status immunities granted by abilities */
export function abilityStatusImmune(mon, status){
  const a = activeAbility(mon);
  if((a==='immunity') && status==='poisoned') return true;
  if((a==='limber') && status==='paralyzed') return true;
  if((a==='water-veil') && status==='burned') return true;
  if((a==='insomnia'||a==='vital-spirit'||a==='sweet-veil') && status==='asleep') return true;
  if((a==='magma-armor') && status==='frozen') return true;
  if((a==='own-tempo')) return false; // confusion handled separately
  return false;
}
/* speed multiplier from weather/terrain abilities */
export function abilitySpeedMult(mon, weather){
  const a = activeAbility(mon);
  if(a==='chlorophyll' && weather==='sun') return 2;
  if(a==='swift-swim' && weather==='rain') return 2;
  if(a==='sand-rush' && weather==='sandstorm') return 2;
  if(a==='slush-rush' && weather==='hail') return 2;
  return 1;
}
/* offensive ability multipliers beyond pinch boosts */
export function abilityAtkMultExtra(attacker, move, eff){
  const a = activeAbility(attacker);
  if(a==='technician' && (move.power||0) <= 60) return 1.5;
  if(a==='adaptability' && (attacker.types||[]).includes(move.type)) return 1.33; // turns STAB 1.5->2 approx
  if(a==='tinted-lens' && eff < 1) return 2;
  if(a==='solar-power' && move.damage_class==='special') return 1.5;
  return 1;
}
/* KO ability triggers (Moxie). returns events */
export function abilityOnKO(attacker){
  const a = activeAbility(attacker);
  const out = [];
  if(a==='moxie'){
    attacker._stages = attacker._stages || freshStages();
    if((attacker._stages.attack||0) < 6){ attacker._stages.attack++; out.push({ message:`${(attacker.nickname||attacker.name).toUpperCase()} ficou mais confiante (Soberba)! +Ataque!` }); }
  }
  return out;
}
/* switch-out regeneration */
export function abilityOnSwitchOut(mon){
  if(activeAbility(mon)==='regenerator' && mon.hp>0 && mon.hp<mon.maxHp){
    const heal = Math.floor(mon.maxHp/3);
    mon.hp = Math.min(mon.maxHp, mon.hp + heal);
    if(activeAbility(mon)==='natural-cure') mon.status='none';
    return true;
  }
  if(activeAbility(mon)==='natural-cure' && mon.status && mon.status!=='none'){ mon.status='none'; return true; }
  return false;
}

/* ---------- Abilities ---------- */
/* mon.abilities is an array of names; the first is treated as active. */
export function activeAbility(mon){ return (mon.abilities && mon.abilities[0]) || null; }
export const ABILITY_PT = {
  intimidate:'Intimidação', levitate:'Levitação', drizzle:'Garoa', drought:'Seca',
  'sand-stream':'Fluxo de Areia', 'snow-warning':'Alerta de Neve', blaze:'Labareda',
  torrent:'Torrente', overgrow:'Cresc. Veloz', swarm:'Enxame', 'flash-fire':'Absorver Fogo',
  'water-absorb':'Absorver Água', 'volt-absorb':'Absorver Volt', 'thick-fat':'Gordura',
  sturdy:'Resistência', 'speed-boost':'Aceleração', guts:'Coração', 'huge-power':'Força Bruta',
  'sand-veil':'Véu de Areia', 'magic-guard':'Guarda Mágica', 'static':'Estática',
  'flame-body':'Corpo Ígneo', 'poison-point':'Ponta Tóxica', 'rough-skin':'Pele Áspera',
};
export function abilityLabel(name){ return ABILITY_PT[name] || (name||'').replace(/-/g,' '); }

/* On switch-in: returns events [{message, weather?}] */
export function abilitySwitchIn(mon, foe){
  const a = activeAbility(mon);
  const out = [];
  const nm = (m)=> (m.nickname||m.name).toUpperCase();
  if(a === 'intimidate' && foe){
    foe._stages = foe._stages || freshStages();
    foe._stages.attack = Math.max(-6, (foe._stages.attack||0) - 1);
    out.push({ message:`Intimidação de ${nm(mon)} reduziu o Ataque de ${nm(foe)}!` });
  }
  const weatherAbil = { drizzle:'rain', drought:'sun', 'sand-stream':'sandstorm', 'snow-warning':'hail' }[a];
  if(weatherAbil){
    out.push({ message:`${nm(mon)} ativou ${abilityLabel(a)}!`, weather: weatherAbil });
  }
  return out;
}

/* Type-based immunities/absorptions from abilities. Returns null or { immune, heal, message } */
export function abilityAbsorb(defender, move){
  const a = activeAbility(defender);
  const t = move.type;
  const nm = (defender.nickname||defender.name).toUpperCase();
  if(a === 'levitate' && t === 'ground') return { immune:true, message:`${nm} levita e ignora o golpe!` };
  if(a === 'flash-fire' && t === 'fire') return { immune:true, message:`${nm} absorveu o fogo!` };
  if(a === 'water-absorb' && t === 'water') return { immune:true, heal:0.25, message:`${nm} absorveu a água e recuperou PS!` };
  if(a === 'volt-absorb' && t === 'electric') return { immune:true, heal:0.25, message:`${nm} absorveu a eletricidade e recuperou PS!` };
  return null;
}

/* Offensive damage multiplier from attacker ability (pinch boosts, huge power) */
export function abilityAtkMult(attacker, move){
  const a = activeAbility(attacker);
  const lowHp = attacker.hp / attacker.maxHp <= 1/3;
  if(a === 'blaze' && move.type==='fire' && lowHp) return 1.5;
  if(a === 'torrent' && move.type==='water' && lowHp) return 1.5;
  if(a === 'overgrow' && move.type==='grass' && lowHp) return 1.5;
  if(a === 'swarm' && move.type==='bug' && lowHp) return 1.5;
  if(a === 'huge-power' && move.damage_class==='physical') return 1.5;
  if(a === 'guts' && attacker.status && attacker.status!=='none' && move.damage_class==='physical') return 1.5;
  return 1;
}

/* Defensive damage multiplier from defender ability */
export function abilityDefMult(defender, move){
  const a = activeAbility(defender);
  if(a === 'thick-fat' && (move.type==='fire'||move.type==='ice')) return 0.5;
  return 1;
}

/* Sturdy: survive a OHKO from full HP at 1 HP. Returns true if it triggered. */
export function abilitySturdy(defender, incomingDmg){
  if(activeAbility(defender) === 'sturdy' && defender.hp === defender.maxHp && incomingDmg >= defender.hp){
    return true;
  }
  return false;
}

/* Contact abilities that punish/afflict the attacker. Returns events. */
export function abilityContact(defender, attacker, move){
  if(!makesContact(move)) return [];
  const a = activeAbility(defender);
  const out = [];
  const nmA = (attacker.nickname||attacker.name).toUpperCase();
  if(a === 'rough-skin'){
    const d = Math.max(1, Math.floor(attacker.maxHp/8));
    attacker.hp = Math.max(0, attacker.hp - d);
    out.push({ message:`A Pele Áspera feriu ${nmA}!` });
  }
  if(a === 'static' && Math.random()<0.3){ const r = applyStatus(attacker,'paralyzed'); if(r.ok) out.push({ message:`${nmA} ficou paralisado pela Estática!` }); }
  if(a === 'flame-body' && Math.random()<0.3){ const r = applyStatus(attacker,'burned'); if(r.ok) out.push({ message:`${nmA} se queimou no Corpo Ígneo!` }); }
  if(a === 'poison-point' && Math.random()<0.3){ const r = applyStatus(attacker,'poisoned'); if(r.ok) out.push({ message:`${nmA} foi envenenado pela Ponta Tóxica!` }); }
  return out;
}

/* End-of-turn ability effects (speed boost, etc.) */
export function abilityEndOfTurn(mon){
  const a = activeAbility(mon);
  const out = [];
  if(a === 'speed-boost'){
    mon._stages = mon._stages || freshStages();
    if((mon._stages.speed||0) < 6){ mon._stages.speed++; out.push({ message:`${(mon.nickname||mon.name).toUpperCase()} acelerou!` }); }
  }
  return out;
}
export function abilityBlocksStatus(mon){
  // magic-guard ignores indirect damage; here we just expose the flag
  return activeAbility(mon) === 'magic-guard';
}
