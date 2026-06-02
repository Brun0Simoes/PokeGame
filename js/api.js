/* ============================================================
   api.js — PokéAPI fetcher with mem + localStorage cache
   ============================================================ */

const BASE = 'https://pokeapi.co/api/v2';
const LS_KEY = 'pkq:apicache:v1';

class APIService {
  constructor(){
    this.mem = new Map();
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(raw){
        const obj = JSON.parse(raw);
        Object.entries(obj).forEach(([k,v])=>this.mem.set(k,v));
      }
    }catch{}
  }
  _persistSubset(){
    try{
      const subset = {};
      this.mem.forEach((v,k)=>{
        if(/\/(generation|region|type|pokedex)\//.test(k)) subset[k]=v;
      });
      localStorage.setItem(LS_KEY, JSON.stringify(subset));
    }catch{}
  }
  async _get(path){
    const url = BASE + path;
    if(this.mem.has(url)) return this.mem.get(url);
    try{
      const res = await fetch(url);
      if(!res.ok) throw new Error('HTTP '+res.status);
      const json = await res.json();
      this.mem.set(url, json);
      this._persistSubset();
      return json;
    }catch(err){
      console.warn('[api]', url, err);
      return null;
    }
  }
  async _getAbsolute(url){
    if(this.mem.has(url)) return this.mem.get(url);
    try{
      const res = await fetch(url);
      if(!res.ok) throw new Error('HTTP '+res.status);
      const json = await res.json();
      this.mem.set(url, json);
      return json;
    }catch(err){
      console.warn('[api]', url, err);
      return null;
    }
  }
  getPokemon(idOrName){ return this._get(`/pokemon/${idOrName}`); }
  getSpecies(idOrName){ return this._get(`/pokemon-species/${idOrName}`); }
  getType(name){ return this._get(`/type/${name}`); }
  getAllGenerations(){ return this._get(`/generation?limit=50`); }
  getGeneration(id){ return this._get(`/generation/${id}`); }
  getAllRegions(){ return this._get(`/region?limit=50`); }
  getRegion(id){ return this._get(`/region/${id}`); }
  getPokedex(id){ return this._get(`/pokedex/${id}`); }
  getMove(name){ return this._get(`/move/${name}`); }

  /* Sprite resolver. Priority chain: showdown anim → genV anim → front → home → official */
  getBestSprite(p, style='showdown', shiny=false){
    if(!p?.sprites) return null;
    const s = p.sprites;
    const showdown = s.other?.showdown || {};
    const genV = s.versions?.['generation-v']?.['black-white']?.animated || {};
    const home = s.other?.home || {};
    const official = s.other?.['official-artwork'] || {};
    const variant = shiny ? 'front_shiny' : 'front_default';
    const chains = {
      showdown:[ showdown[variant], genV[variant], s[variant], home[variant], official[variant] ],
      genv:    [ genV[variant], showdown[variant], s[variant], home[variant] ],
      front:   [ s[variant], home[variant], official[variant] ],
      home:    [ home[variant], official[variant], s[variant] ],
      official:[ official[variant], home[variant], s[variant] ],
    };
    return (chains[style] || chains.showdown).find(Boolean) || s.front_default;
  }
  getBackSprite(p, shiny=false){
    if(!p?.sprites) return null;
    const s = p.sprites;
    const v = shiny ? 'back_shiny' : 'back_default';
    return s[v] || s.versions?.['generation-v']?.['black-white']?.animated?.[v] || null;
  }
  getCryUrl(p){ return p?.cries?.latest || p?.cries?.legacy || null; }

  async getRandomEncounter(filters){
    const { regionId, type, rarityBias = 0 } = filters || {};
    const { REGION_POOL } = await import('./data.js');
    // 1) If a region is set: pull from its species ID range.
    if(regionId && REGION_POOL[regionId]){
      const [lo, hi] = REGION_POOL[regionId];
      const range = hi - lo + 1;
      // base_experience ceiling scales with rarityBias:
      //   bias 0    -> ~80  (weak base forms only)
      //   bias 0.3  -> ~200 (mid evolutions)
      //   bias 0.6+ -> ~400 (final evos / pseudo-legendaries / legendaries)
      const ceiling = 70 + rarityBias * 560;
      const pickId = () => lo + Math.floor(Math.random() * range);
      let best = null, bestExp = Infinity;
      for(let i=0;i<7;i++){
        const p = await this.getPokemon(pickId());
        if(!p) continue;
        if(type && !p.types.some(t=>t.type.name===type)) continue;
        const be = p.base_experience || 100;
        // track weakest candidate seen as a fallback
        if(be < bestExp){ best = p; bestExp = be; }
        if(be <= ceiling) return p;            // accepted: within power budget
        if(Math.random() < 0.10) return p;     // rare wildcard for variety
      }
      return best || this.getPokemon(pickId());
    }
    // 2) Type-only filter — use type endpoint.
    if(type){
      const t = await this.getType(type);
      const names = (t?.pokemon || []).map(x=>x.pokemon.name);
      if(names.length){
        const pick = names[Math.floor(Math.random()*names.length)];
        return this.getPokemon(pick);
      }
    }
    // 3) Total random across all gens 1-8.
    const id = 1 + Math.floor(Math.random()*898);
    return this.getPokemon(id);
  }

  /* Full evolution chain with triggers, flattened to a linear path.
     Returns [{ name, id, trigger, minLevel, item, timeOfDay }] base->final. */
  async getEvolutionPath(speciesIdOrName){
    const sp = await this.getSpecies(speciesIdOrName);
    const url = sp?.evolution_chain?.url;
    if(!url) return null;
    const chain = await this._getAbsolute(url);
    if(!chain?.chain) return null;
    const path = [];
    let node = chain.chain;
    let prevTrigger = null;
    while(node){
      const idFromUrl = node.species.url.split('/').filter(Boolean).pop();
      path.push({ name: node.species.name, id: parseInt(idFromUrl), ...(prevTrigger||{}) });
      const next = (node.evolves_to && node.evolves_to[0]) || null;
      if(next){
        const d = (next.evolution_details && next.evolution_details[0]) || {};
        prevTrigger = {
          trigger: d.trigger?.name || 'level-up',
          minLevel: d.min_level || null,
          item: d.item?.name || d.held_item?.name || null,
          timeOfDay: d.time_of_day || null,
          happiness: d.min_happiness || null,
        };
      }
      node = next;
    }
    return path;
  }

  /* Linear evolution chain (names, base → final). Branches take first path. */
  async getEvolutionNames(speciesIdOrName){
    const sp = await this.getSpecies(speciesIdOrName);
    const url = sp?.evolution_chain?.url;
    if(!url) return null;
    const chain = await this._getAbsolute(url);
    if(!chain?.chain) return null;
    const names = [];
    let node = chain.chain;
    while(node){
      names.push(node.species.name);
      node = (node.evolves_to && node.evolves_to[0]) || null;
    }
    return names;
  }

  /* Given a pokemon, advance it along its evolution chain up to maxStage
     (0=base,1,2). If it's already at/above that stage, return unchanged.
     Returns a (possibly new) pokemon object. */
  async getEvolvedForm(pokemon, maxStage){
    if(!pokemon || maxStage <= 0) return pokemon;
    try{
      const names = await this.getEvolutionNames(pokemon.species?.name || pokemon.name || pokemon.id);
      if(!names || names.length <= 1) return pokemon;
      const curName = pokemon.species?.name || pokemon.name;
      const curIdx = Math.max(0, names.indexOf(curName));
      const targetIdx = Math.min(maxStage, names.length - 1);
      if(targetIdx <= curIdx) return pokemon;
      const evolved = await this.getPokemon(names[targetIdx]);
      return evolved || pokemon;
    }catch{ return pokemon; }
  }
}

export const api = new APIService();

/* ============================================================
   Build a "mon instance" from an API pokemon + level
   This is the in-game Pokémon shape (what goes into party/box).
   ============================================================ */
import { levelFromXp, xpForLevel } from './data.js';
import { STAT_KEYS, randomIVs, zeroEVs, randomNature, computeStat } from './mon-stats.js';

export async function makeMon({ speciesIdOrName, level, shiny=false, nickname=null, source=null, ball='poke-ball', spriteStyle='showdown', ivs=null, evs=null, nature=null }){
  const p = await api.getPokemon(speciesIdOrName);
  if(!p) return null;
  const base = {};
  for(const st of p.stats||[]){ base[st.stat.name] = st.base_stat; }
  const monIvs = ivs || randomIVs();
  const monEvs = evs || zeroEVs();
  const monNature = nature || randomNature();
  const stats = {};
  for(const k of STAT_KEYS){
    stats[k] = computeStat(k, base, monIvs, monEvs, level, monNature);
  }
  const moves = await pickMoveset(p, level);
  return {
    uid: 'm_'+Math.random().toString(36).slice(2,9),
    id: p.id,
    name: p.name,
    nickname: nickname,
    level,
    xp: xpForLevel(level),
    hp: stats.hp, maxHp: stats.hp,
    status: 'none', // none|poisoned|paralyzed|burned|frozen|asleep|confused
    shiny,
    types: p.types.map(t=>t.type.name),
    sprite: {
      front: api.getBestSprite(p, spriteStyle, false),
      back:  api.getBackSprite(p, false),
      shiny: api.getBestSprite(p, spriteStyle, true),
    },
    cry: api.getCryUrl(p),
    base,
    ivs: monIvs,
    evs: monEvs,
    nature: monNature,
    stats,
    moves,
    abilities: (p.abilities||[]).map(a=>a.ability.name),
    height: p.height,
    weight: p.weight,
    baseExp: p.base_experience,
    source: source || 'unknown',
    ball,
    friendship: 70,
    caughtAt: Date.now(),
  };
}

/* Pick up to 4 moves the species could plausibly know by `level`.
   PokéAPI returns lots of move learn data; we'll grab a small spread
   and convert each to our move shape on demand. */
async function pickMoveset(p, level){
  const learnable = (p.moves||[])
    .map(m => {
      const lm = m.version_group_details
        .filter(v => v.move_learn_method.name === 'level-up' && v.level_learned_at <= level && v.level_learned_at > 0)
        .sort((a,b)=> b.level_learned_at - a.level_learned_at)[0];
      return lm ? { name: m.move.name, lvl: lm.level_learned_at } : null;
    })
    .filter(Boolean)
    .sort((a,b)=> b.lvl - a.lvl);

  const picks = learnable.slice(0, 4);
  if(picks.length===0){
    // fallback to first 1-2 moves the species has at any level (typical for low-level/unevolved)
    const fallback = (p.moves||[]).slice(0,2).map(m=>({ name:m.move.name, lvl:1 }));
    picks.push(...fallback);
  }
  // Always at least include tackle/struggle-equivalent
  if(picks.length===0) picks.push({ name:'tackle', lvl:1 });

  const moves = [];
  for(const pk of picks){
    const data = await api.getMove(pk.name);
    if(!data) continue;
    moves.push(moveShape(data));
  }
  return moves;
}

/* Convert a PokéAPI move into our move shape. */
export function moveShape(data){
  return {
    name: data.name,
    type: data.type?.name || 'normal',
    power: data.power || 0,
    accuracy: data.accuracy || 100,
    pp: data.pp || 10,
    maxPp: data.pp || 10,
    priority: data.priority || 0,
    damage_class: data.damage_class?.name || 'physical',
    meta: { ailment: data.meta?.ailment?.name || 'none' },
  };
}

/* All level-up moves a species can learn by `level` (for the relearner). */
export async function learnableMoves(speciesIdOrName, level){
  const p = await api.getPokemon(speciesIdOrName);
  if(!p) return [];
  const seen = new Map();
  for(const m of p.moves||[]){
    const lm = m.version_group_details
      .filter(v => v.move_learn_method.name === 'level-up' && v.level_learned_at > 0 && v.level_learned_at <= level)
      .sort((a,b)=>a.level_learned_at - b.level_learned_at)[0];
    if(lm){
      const prev = seen.get(m.move.name);
      if(!prev || lm.level_learned_at < prev) seen.set(m.move.name, lm.level_learned_at);
    }
  }
  return [...seen.entries()].map(([name,lvl])=>({ name, lvl })).sort((a,b)=>a.lvl-b.lvl);
}

export async function fetchMove(name){
  const data = await api.getMove(name);
  return data ? moveShape(data) : null;
}
