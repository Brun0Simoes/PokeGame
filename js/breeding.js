/* ============================================================
   breeding.js — Day-Care: deposit 2 Pokémon, produce an Egg,
   hatch by winning battles (step counter). IV inheritance + nature.
   ============================================================ */

import { api, makeMon } from './api.js';
import { STAT_KEYS, randomIVs, zeroEVs, randomNature, recomputeStats } from './mon-stats.js';

export function ensureDaycare(save){
  if(!save.daycare) save.daycare = { slots:[null,null], egg:null };
  return save.daycare;
}

/* Two mons are compatible if they share an egg group proxy:
   simplified — same first type OR same evolution base family. */
export async function compatible(a, b){
  if(!a || !b) return false;
  if(a.uid === b.uid) return false;
  // shared type = compatible (simple, generous rule)
  const at = a.types||[], bt = b.types||[];
  if(at.some(t=>bt.includes(t))) return true;
  // same evolution family
  try{
    const pa = await api.getEvolutionPath(a.id);
    const pb = await api.getEvolutionPath(b.id);
    if(pa && pb && pa[0] && pb[0] && pa[0].id === pb[0].id) return true;
  }catch{}
  return false;
}

/* Produce an egg from the two day-care mons. The egg stores the
   would-be baby species (base form of the mother/first slot) plus
   inherited IVs (3 random stats from a random parent) and nature. */
export async function layEgg(save){
  const dc = ensureDaycare(save);
  const [a, b] = dc.slots;
  if(!a || !b || dc.egg) return null;
  // baby = base form of slot A's evolution family
  let babyId = a.id;
  try{
    const path = await api.getEvolutionPath(a.id);
    if(path && path[0]) babyId = path[0].id;
  }catch{}
  // IV inheritance: 3 stats copied from a random parent, rest random
  const baseIv = randomIVs();
  const inheritKeys = [...STAT_KEYS].sort(()=>Math.random()-0.5).slice(0,3);
  for(const k of inheritKeys){
    const parent = Math.random()<0.5 ? a : b;
    if(parent.ivs) baseIv[k] = parent.ivs[k];
  }
  // nature: 50% chance inherited from a parent
  const nature = Math.random()<0.5 ? (a.nature || randomNature()) : (b.nature || randomNature());
  // shiny: small boosted chance (Masuda-like)
  const shiny = Math.random() < 1/512;
  dc.egg = {
    babyId, ivs: baseIv, nature, shiny,
    stepsNeeded: 8, stepsDone: 0, // "steps" = battles won
    laidAt: Date.now(),
  };
  return dc.egg;
}

/* Advance the egg by N steps (called on battle win). Returns true if ready. */
export function advanceEgg(save, n=1){
  const dc = save.daycare;
  if(!dc || !dc.egg) return false;
  dc.egg.stepsDone = Math.min(dc.egg.stepsNeeded, dc.egg.stepsDone + n);
  return dc.egg.stepsDone >= dc.egg.stepsNeeded;
}

/* Hatch the egg into a real Lv.1 mon and add to party/box. Returns the mon. */
export async function hatchEgg(save){
  const dc = save.daycare;
  if(!dc || !dc.egg || dc.egg.stepsDone < dc.egg.stepsNeeded) return null;
  const e = dc.egg;
  const mon = await makeMon({
    speciesIdOrName: e.babyId,
    level: 1,
    shiny: e.shiny,
    ivs: e.ivs,
    evs: zeroEVs(),
    nature: e.nature,
    source: 'ovo (day-care)',
  });
  dc.egg = null;
  if(!mon) return null;
  if(save.party.length < 6) save.party.push(mon);
  else save.box.push(mon);
  save.pokedex.seen[mon.id] = save.pokedex.caught[mon.id] = {
    name: mon.name, types: mon.types, sprite: mon.sprite.front,
    at: Date.now(), region: save.trainer.region, shiny: mon.shiny,
  };
  return mon;
}
