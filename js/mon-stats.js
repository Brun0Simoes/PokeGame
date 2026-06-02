/* ============================================================
   mon-stats.js — mainline stat engine: natures, IVs, EVs
   ============================================================ */

export const STAT_KEYS = ['hp','attack','defense','special-attack','special-defense','speed'];
export const STAT_LABEL = {
  hp:'PS', attack:'Ataque', defense:'Defesa',
  'special-attack':'Atq. Esp.', 'special-defense':'Def. Esp.', speed:'Velocidade',
};
export const STAT_SHORT = {
  hp:'PS', attack:'ATQ', defense:'DEF',
  'special-attack':'AT.E', 'special-defense':'DF.E', speed:'VEL',
};

export const MAX_IV = 31;
export const MAX_EV_STAT = 252;
export const MAX_EV_TOTAL = 510;

/* 25 natures: [increased stat, decreased stat]. null/null = neutral. */
export const NATURES = {
  hardy:   [null,null],            lonely:  ['attack','defense'],
  brave:   ['attack','speed'],     adamant: ['attack','special-attack'],
  naughty: ['attack','special-defense'],
  bold:    ['defense','attack'],   docile:  [null,null],
  relaxed: ['defense','speed'],    impish:  ['defense','special-attack'],
  lax:     ['defense','special-defense'],
  timid:   ['speed','attack'],     hasty:   ['speed','defense'],
  serious: [null,null],            jolly:   ['speed','special-attack'],
  naive:   ['speed','special-defense'],
  modest:  ['special-attack','attack'], mild:  ['special-attack','defense'],
  quiet:   ['special-attack','speed'],  bashful:[null,null],
  rash:    ['special-attack','special-defense'],
  calm:    ['special-defense','attack'], gentle:['special-defense','defense'],
  sassy:   ['special-defense','speed'],  careful:['special-defense','special-attack'],
  quirky:  [null,null],
};
export const NATURE_NAMES_PT = {
  hardy:'Robusta', lonely:'Solitária', brave:'Valente', adamant:'Rígida', naughty:'Travessa',
  bold:'Audaz', docile:'Dócil', relaxed:'Relaxada', impish:'Capciosa', lax:'Frouxa',
  timid:'Tímida', hasty:'Apressada', serious:'Séria', jolly:'Alegre', naive:'Ingênua',
  modest:'Modesta', mild:'Mansa', quiet:'Quieta', bashful:'Acanhada', rash:'Precipitada',
  calm:'Calma', gentle:'Gentil', sassy:'Atrevida', careful:'Cuidadosa', quirky:'Peculiar',
};
export const NATURE_LIST = Object.keys(NATURES);

export function natureMod(nature, statKey){
  const n = NATURES[nature] || [null,null];
  if(n[0] === statKey) return 1.1;
  if(n[1] === statKey) return 0.9;
  return 1.0;
}
export function randomNature(){
  return NATURE_LIST[Math.floor(Math.random()*NATURE_LIST.length)];
}
export function randomIVs(){
  const iv = {};
  for(const k of STAT_KEYS) iv[k] = Math.floor(Math.random()*(MAX_IV+1));
  return iv;
}
export function zeroEVs(){
  const ev = {};
  for(const k of STAT_KEYS) ev[k] = 0;
  return ev;
}

/* Full mainline stat formula. base = species base stats map. */
export function computeStat(statKey, base, iv, ev, level, nature){
  const b = base[statKey] || 1;
  const i = iv[statKey] || 0;
  const e = ev[statKey] || 0;
  if(statKey === 'hp'){
    if(b === 1) return 1; // Shedinja-like guard
    return Math.floor((2*b + i + Math.floor(e/4)) * level / 100) + level + 10;
  }
  const raw = Math.floor((2*b + i + Math.floor(e/4)) * level / 100) + 5;
  return Math.floor(raw * natureMod(nature, statKey));
}

/* Recompute all stats for a mon in place. Keeps current hp ratio. */
export function recomputeStats(mon){
  if(!mon.base || !mon.ivs || !mon.evs) return mon;
  const ratio = mon.maxHp ? mon.hp / mon.maxHp : 1;
  const next = {};
  for(const k of STAT_KEYS){
    next[k] = computeStat(k, mon.base, mon.ivs, mon.evs, mon.level, mon.nature);
  }
  mon.stats = next;
  const oldMax = mon.maxHp;
  mon.maxHp = next.hp;
  // preserve HP proportionally (round)
  mon.hp = Math.max(1, Math.min(mon.maxHp, Math.round(mon.maxHp * ratio)));
  if(oldMax === undefined) mon.hp = mon.maxHp;
  return mon;
}

export function totalEVs(ev){
  return STAT_KEYS.reduce((a,k)=>a+(ev[k]||0),0);
}

/* IV/EV "judge" descriptors */
export function ivLabel(v){
  if(v === 31) return 'Perfeito';
  if(v >= 26) return 'Excelente';
  if(v >= 16) return 'Muito Bom';
  if(v >= 1)  return 'OK';
  return 'Sem Potencial';
}
