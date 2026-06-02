/* ============================================================
   trainer.js — trainer-level progression
   Trainer level rises by winning battles and catching Pokémon.
   Higher level → stronger, more evolved, rarer wild encounters.
   ============================================================ */

import { audio } from './audio.js';
import { toast } from './ui.js';

export const MAX_TRAINER_LEVEL = 50;

/* Cumulative EXP required to *reach* a given level. Level 1 = 0. */
export function trainerExpToReach(level){
  return Math.floor(50 * (level - 1) * level);
}
export function trainerLevelFromExp(exp){
  let l = 1;
  while(l < MAX_TRAINER_LEVEL && trainerExpToReach(l + 1) <= exp) l++;
  return l;
}

/* XP rewards */
export const TRAINER_XP = {
  winWild:     20,
  catch:       45,
  winNpc:      70,
  winGym:     220,
  winElite:   320,
  winChampion:1200,
};

/* Make sure older saves have the fields */
export function ensureTrainerProgress(save){
  if(!save || !save.trainer) return;
  if(save.trainer.level == null) save.trainer.level = 1;
  if(save.trainer.exp == null)   save.trainer.exp = trainerExpToReach(save.trainer.level);
  // backfill bag categories added in later versions
  if(save.bag){
    for(const cat of ['balls','medicine','ev','held','mega','zcrystal','tm','evo']){
      if(!save.bag[cat]) save.bag[cat] = {};
    }
    if(!Array.isArray(save.bag.key)) save.bag.key = [];
    for(const k of ['mega-ring','z-ring','dynamax-band']){
      if(!save.bag.key.includes(k)) save.bag.key.push(k);
    }
  }
  // backfill mon fields (IVs/EVs/nature/base/held) for older mons
  const allMons = [...(save.party||[]), ...(save.box||[])];
  for(const m of allMons) migrateMon(m);
}

function migrateMon(m){
  if(!m) return;
  if(!m.ivs){
    m.ivs = {};
    for(const k of ['hp','attack','defense','special-attack','special-defense','speed']) m.ivs[k] = Math.floor(Math.random()*32);
  }
  if(!m.evs){
    m.evs = {};
    for(const k of ['hp','attack','defense','special-attack','special-defense','speed']) m.evs[k] = 0;
  }
  if(!m.nature){
    const list = ['hardy','lonely','brave','adamant','naughty','bold','docile','relaxed','impish','lax','timid','hasty','serious','jolly','naive','modest','mild','quiet','bashful','rash','calm','gentle','sassy','careful','quirky'];
    m.nature = list[Math.floor(Math.random()*list.length)];
  }
  // derive base stats from current stats if missing (best-effort, keeps game stable)
  if(!m.base && m.stats){
    m.base = {};
    const lvl = m.level || 5;
    for(const k of Object.keys(m.stats)){
      // invert simplified formula assuming IV=15, EV=0
      if(k === 'hp'){
        m.base[k] = Math.max(1, Math.round(((m.stats[k] - lvl - 10) * 100 / lvl - 15) / 2));
      }else{
        m.base[k] = Math.max(1, Math.round(((m.stats[k] - 5) * 100 / lvl - 15) / 2));
      }
    }
  }
  if(m.held === undefined) m.held = null;
  if(m.friendship === undefined) m.friendship = 70;
}

/* Award XP, handle level-ups, persist. Returns {leveledUp, level}. */
export function awardTrainerXp(ctx, amount){
  ensureTrainerProgress(ctx.save);
  const t = ctx.save.trainer;
  const before = t.level;
  t.exp += amount;
  const after = trainerLevelFromExp(t.exp);
  let leveledUp = false;
  if(after > before){
    t.level = after;
    leveledUp = true;
    audio.playSfx('badge');
    toast(`★ NÍVEL DE TREINADOR ${after}! Pokémon mais fortes aparecem agora.`, 'success', 2800);
  }
  ctx.saveAndSync();
  return { leveledUp, level: t.level, gained: amount };
}

/* Progress within the current level — for the sidebar EXP bar. */
export function trainerExpProgress(save){
  ensureTrainerProgress(save);
  const cur  = trainerExpToReach(save.trainer.level);
  const next = trainerExpToReach(save.trainer.level + 1);
  const span = Math.max(1, next - cur);
  const into = save.trainer.exp - cur;
  return {
    level: save.trainer.level,
    into, span,
    pct: Math.max(0, Math.min(1, into / span)),
    max: save.trainer.level >= MAX_TRAINER_LEVEL,
  };
}

/* Encounter shaping based on trainer level:
     - level band of wild Pokémon
     - max evolution stage allowed (0=base, 1, 2)
     - rarity bias (0..1) toward the upper part of the regional dex,
       where pseudo-legendaries / legendaries usually sit
*/
export function encounterParamsFor(trainerLevel){
  const lvl = Math.max(1, trainerLevel || 1);
  const center = Math.min(72, 3 + Math.round(lvl * 1.6));
  return {
    levelMin: Math.max(2, center - 3),
    levelMax: Math.min(80, center + 4),
    // base forms early; 2nd stage from 12; final from 28
    maxEvoStage: lvl < 12 ? 0 : lvl < 28 ? 1 : 2,
    // rarity ramps slowly: ~0 at low level, 0.5 near cap
    rarityBias: Math.max(0, Math.min(0.55, (lvl - 6) / 80)),
  };
}
