/* ============================================================
   evolution.js — evolve party Pokémon (level / stone / trade)
   Keeps IVs, EVs, nature, level, nickname, moves; swaps species
   identity + base stats + sprites + types; recomputes stats.
   ============================================================ */

import { el, mount, button, toast } from './ui.js';
import { audio } from './audio.js';
import { api } from './api.js';
import { STAT_KEYS, computeStat, recomputeStats } from './mon-stats.js';

/* Map evolution stone item ids -> the PokéAPI item name they satisfy */
export const STONE_ITEM_MAP = {
  'fire-stone':'fire-stone', 'water-stone':'water-stone', 'thunder-stone':'thunder-stone',
  'leaf-stone':'leaf-stone', 'moon-stone':'moon-stone', 'sun-stone':'sun-stone',
  'shiny-stone':'shiny-stone', 'dusk-stone':'dusk-stone', 'dawn-stone':'dawn-stone',
  'ice-stone':'ice-stone', 'oval-stone':'oval-stone',
};

/* Does this mon have a next evolution? Returns the path entry to evolve INTO, or null. */
export async function nextEvolution(mon){
  try{
    const path = await api.getEvolutionPath(mon.id);
    if(!path || path.length <= 1) return null;
    const idx = path.findIndex(p => p.id === mon.id);
    if(idx < 0 || idx >= path.length - 1) return null;
    return path[idx + 1]; // { name, id, trigger, minLevel, item, ... }
  }catch{ return null; }
}

/* Can evolve right now by LEVEL or HAPPINESS? */
export async function canEvolveByLevel(mon){
  const nxt = await nextEvolution(mon);
  if(!nxt) return null;
  const trig = nxt.trigger || 'level-up';
  if(trig === 'level-up'){
    // happiness evolution
    if(nxt.happiness){ if((mon.friendship||0) >= nxt.happiness) return nxt; return null; }
    if(!nxt.minLevel || mon.level >= nxt.minLevel) return nxt;
  }
  return null;
}

/* ---- PHASE 6: Trade-com-held-item canonical ----
   Slowpoke + King's Rock = Slowking (trade-with-item)
   Onix + Metal Coat = Steelix
   Se nxt.item existe: requer held item especifico.
   Senao: trade simples. */
export async function canEvolveByTrade(mon){
  const nxt = await nextEvolution(mon);
  if(!nxt) return null;
  if(nxt.trigger !== 'trade') return null;
  if(nxt.item){
    // requer held item especifico
    if(mon.held && mon.held === nxt.item) return nxt;
    return null;
  }
  return nxt; // trade simples (Machoke→Machamp, Haunter→Gengar)
}

/* Can evolve by HELD ITEM (level-up while holding)? returns target or null */
export async function canEvolveByHeldItem(mon, heldItemName){
  const nxt = await nextEvolution(mon);
  if(!nxt) return null;
  if(nxt.trigger === 'level-up' && nxt.item && nxt.item === heldItemName) return nxt;
  return null;
}

/* Can this stone evolve this mon? returns target entry or null */
export async function canEvolveByStone(mon, stoneItemName){
  const nxt = await nextEvolution(mon);
  if(!nxt) return null;
  if(nxt.trigger === 'use-item' && nxt.item === stoneItemName) return nxt;
  return null;
}

/* Perform the evolution in place on the mon object. */
export async function evolveMon(mon, target){
  const p = await api.getPokemon(target.id);
  if(!p) return false;
  const base = {};
  for(const st of p.stats||[]) base[st.stat.name] = st.base_stat;
  mon.id = p.id;
  mon.name = p.name;
  mon.types = p.types.map(t=>t.type.name);
  mon.base = base;
  mon.abilities = (p.abilities||[]).map(a=>a.ability.name);
  mon.baseExp = p.base_experience;
  mon.height = p.height; mon.weight = p.weight;
  mon.cry = api.getCryUrl(p);
  mon.sprite = {
    front: api.getBestSprite(p, 'showdown', false),
    back:  api.getBackSprite(p, false),
    shiny: api.getBestSprite(p, 'showdown', true),
  };
  recomputeStats(mon);
  mon.hp = mon.maxHp;
  return true;
}

/* Cinematic evolution modal. Resolves when the animation+confirm finishes. */
export function playEvolution(mon, fromSprite, toSpriteResolver){
  return new Promise(async (resolve)=>{
    const backdrop = el('div', { class:'modal-backdrop show evo-backdrop' });
    const stage = el('div', { class:'evo-stage' }, [
      el('div', { class:'evo-flash' }),
      el('img', { class:'evo-spr from', src: fromSprite, style:{ imageRendering:'pixelated' } }),
      el('div', { class:'evo-msg mono' }, `${(mon.nickname||mon.name).toUpperCase()} está evoluindo!`),
    ]);
    backdrop.appendChild(stage);
    document.body.appendChild(backdrop);
    audio.playSfx && audio.playSfx('open');

    // pulse phase
    stage.classList.add('evolving');
    await wait(2600);
    // resolve new sprite
    const toSprite = await toSpriteResolver();
    const img = stage.querySelector('.evo-spr');
    img.src = toSprite || fromSprite;
    stage.classList.remove('evolving');
    stage.classList.add('done');
    audio.playSfx && audio.playSfx('badge');
    stage.querySelector('.evo-msg').innerHTML = `Parabéns! Seu Pokémon evoluiu para <b>${(mon.nickname||mon.name).toUpperCase()}</b>!`;
    await wait(400);
    const okBtn = button({ label:'CONTINUAR ▸', kind:'primary', onClick: ()=>{ backdrop.remove(); resolve(true); } });
    stage.appendChild(okBtn);
  });
}

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

/* Simulate a trade (with NPC or peer). Triggers trade-evolution if applicable.
   Returns { evolved:bool } and mutates the mon in place. */
export async function tradeMon(mon){
  const target = await canEvolveByTrade(mon);
  if(!target) return { evolved:false };
  const fromSprite = mon.shiny ? (mon.sprite.shiny||mon.sprite.front) : mon.sprite.front;
  await playEvolution(mon, fromSprite, async ()=>{
    await evolveMon(mon, target);
    return mon.shiny ? (mon.sprite.shiny||mon.sprite.front) : mon.sprite.front;
  });
  return { evolved:true };
}
