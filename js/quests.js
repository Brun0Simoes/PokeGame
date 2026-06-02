/* ============================================================
   quests.js — daily/career quests + achievement rewards
   Progress is read from the save; rewards are claimable once.
   ============================================================ */

import { ITEMS } from './data.js';

/* career achievements (one-time rewards) */
export const ACHIEVEMENTS = [
  { id:'first-catch', name:'Primeiros Passos', desc:'Capture seu primeiro Pokémon',
    test:s=>caught(s)>=1, reward:{ money:500, items:{ balls:{'great-ball':3} } } },
  { id:'collector-10', name:'Colecionador', desc:'Capture 10 Pokémon',
    test:s=>caught(s)>=10, reward:{ money:1500, items:{ balls:{'ultra-ball':3} } } },
  { id:'collector-30', name:'Pokédex em Progresso', desc:'Capture 30 Pokémon',
    test:s=>caught(s)>=30, reward:{ money:4000, items:{ ev:{'protein':1,'calcium':1} } } },
  { id:'collector-60', name:'Mestre Colecionador', desc:'Capture 60 Pokémon',
    test:s=>caught(s)>=60, reward:{ money:8000, items:{ evo:{'fire-stone':1,'water-stone':1,'thunder-stone':1} } } },
  { id:'shiny-1', name:'Caçador Shiny', desc:'Capture um Pokémon shiny',
    test:s=>shinies(s)>=1, reward:{ money:5000, items:{ held:{'shiny-stone':0} } } },
  { id:'gym-1', name:'Primeira Insígnia', desc:'Vença um líder de ginásio',
    test:s=>s.progress.gymsBeaten.length>=1, reward:{ money:1000, items:{ medicine:{'hyper-potion':2} } } },
  { id:'gym-8', name:'Conquistador Regional', desc:'Vença 8 ginásios',
    test:s=>s.progress.gymsBeaten.length>=8, reward:{ money:6000, items:{ medicine:{'max-revive':2} } } },
  { id:'champ', name:'Campeão', desc:'Torne-se Campeão de uma região',
    test:s=>!!s.progress.championBeaten, reward:{ money:20000, items:{ balls:{'master-ball':1} } } },
  { id:'evolver', name:'Evolucionista', desc:'Tenha 5 Pokémon evoluídos na equipe/PC (Lv.30+)',
    test:s=>[...s.party,...s.box].filter(m=>m.level>=30).length>=5, reward:{ money:3000, items:{ ev:{'carbos':1,'iron':1} } } },
  { id:'rich', name:'Magnata', desc:'Acumule ₽50.000',
    test:s=>s.trainer.money>=50000, reward:{ money:0, items:{ held:{'leftovers':1} } } },
  { id:'level-20', name:'Veterano', desc:'Alcance nível de treinador 20',
    test:s=>s.trainer.level>=20, reward:{ money:5000, items:{ med:{} } } },
];

function caught(s){ return Object.keys(s.pokedex.caught).length; }
function shinies(s){ return Object.values(s.pokedex.caught).filter(c=>c.shiny).length; }

/* ensure the save has a quest-state container */
export function ensureQuestState(save){
  if(!save.quests) save.quests = { claimed:[], daily:null };
  rollDaily(save);
  return save.quests;
}

/* Daily quests reset every calendar day (local). 3 random goals. */
const DAILY_POOL = [
  { id:'d-catch3', name:'Capture 3 Pokémon', target:3, kind:'catch', reward:{ money:800 } },
  { id:'d-catch5', name:'Capture 5 Pokémon', target:5, kind:'catch', reward:{ money:1500 } },
  { id:'d-win3',   name:'Vença 3 batalhas',  target:3, kind:'win',   reward:{ money:1000 } },
  { id:'d-win5',   name:'Vença 5 batalhas',  target:5, kind:'win',   reward:{ money:1800 } },
  { id:'d-wild4',  name:'Encontre 4 selvagens', target:4, kind:'encounter', reward:{ money:600 } },
  { id:'d-evolve1',name:'Evolua 1 Pokémon',  target:1, kind:'evolve', reward:{ money:1200, items:{ ev:{'protein':1} } } },
  { id:'d-gym1',   name:'Vença 1 ginásio',   target:1, kind:'gym',   reward:{ money:2500 } },
];

function todayKey(){ const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

export function rollDaily(save){
  const q = save.quests;
  if(q.daily && q.daily.date === todayKey()) return;
  // pick 3 distinct
  const pool = [...DAILY_POOL].sort(()=>Math.random()-0.5).slice(0,3);
  q.daily = {
    date: todayKey(),
    goals: pool.map(g => ({ ...g, progress:0, done:false, claimed:false })),
  };
}

/* event hook: call when something happens. kind ∈ catch|win|encounter|evolve|gym */
export function questEvent(save, kind, amount=1){
  ensureQuestState(save);
  const goals = save.quests.daily?.goals || [];
  let changed = false;
  for(const g of goals){
    if(g.kind === kind && !g.done){
      g.progress = Math.min(g.target, g.progress + amount);
      if(g.progress >= g.target) g.done = true;
      changed = true;
    }
  }
  return changed;
}

/* grant a reward object {money, items:{cat:{id:qty}}} to the save */
export function grantReward(save, reward){
  if(!reward) return;
  if(reward.money) save.trainer.money += reward.money;
  if(reward.items){
    for(const [cat, entries] of Object.entries(reward.items)){
      const bagCat = cat === 'med' ? 'medicine' : cat;
      if(!save.bag[bagCat]) save.bag[bagCat] = {};
      for(const [id, qty] of Object.entries(entries)){
        if(qty>0) save.bag[bagCat][id] = (save.bag[bagCat][id]||0) + qty;
      }
    }
  }
}

/* summarize a reward for display */
export function rewardText(reward){
  if(!reward) return '—';
  const parts = [];
  if(reward.money) parts.push(`₽${reward.money.toLocaleString('pt-BR')}`);
  if(reward.items){
    for(const entries of Object.values(reward.items)){
      for(const [id,qty] of Object.entries(entries)){
        if(qty>0) parts.push(`${(ITEMS[id]?.name)||id} ×${qty}`);
      }
    }
  }
  return parts.length ? parts.join(' · ') : 'Recompensa';
}
