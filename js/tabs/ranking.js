/* ============================================================
   tabs/ranking.js — leaderboard across local accounts + bots
   Ranks by a composite score (badges, caught, champion, level, tower).
   ============================================================ */

import { el, mount } from '../ui.js';
import { Store } from '../storage.js';
import { REGIONS, gymsFor } from '../data.js';
import { trainerSpriteTile } from '../trainer-sprite.js';

const BOTS = [
  { name:'Red',   sprite:'red',   score:9999, badges:8, caught:151, level:50, champ:true, tower:120 },
  { name:'Blue',  sprite:'blue',  score:9200, badges:8, caught:140, level:48, champ:true, tower:95 },
  { name:'Cynthia',sprite:'cynthia',score:8800, badges:8, caught:160, level:47, champ:true, tower:88 },
  { name:'Lance', sprite:'lance', score:8200, badges:8, caught:130, level:45, champ:true, tower:70 },
  { name:'Steven',sprite:'steven',score:7600, badges:8, caught:128, level:44, champ:true, tower:64 },
  { name:'Leaf',  sprite:'leaf',  score:5400, badges:6, caught:96,  level:38, champ:false, tower:30 },
  { name:'Ethan', sprite:'ethan', score:4200, badges:5, caught:80,  level:34, champ:false, tower:18 },
  { name:'May',   sprite:'may',   score:3100, badges:4, caught:62,  level:30, champ:false, tower:9 },
];

export function scoreOf(save){
  const gyms = REGIONS.reduce((a,r)=>a + gymsFor(r.id).filter(g=>save.progress.gymsBeaten.includes(g.id)).length, 0);
  const caught = Object.keys(save.pokedex.caught).length;
  const tower = save.tower?.best || 0;
  return gyms*400 + caught*40 + (save.progress.championBeaten?2000:0) + (save.trainer.level||1)*60 + tower*120;
}

export function renderRanking(root, ctx){
  const { save, account } = ctx;
  const view = el('div', { class:'tab-page ranking-page' });
  mount(root, view);

  // gather real local accounts
  const reals = Store.listAccounts().map(a=>{
    const s = Store.getSave(a.email);
    if(!s) return null;
    return {
      name: s.trainer.name, sprite:'red', me: a.email===account.email,
      score: scoreOf(s),
      badges: REGIONS.reduce((x,r)=>x + gymsFor(r.id).filter(g=>s.progress.gymsBeaten.includes(g.id)).length,0),
      caught: Object.keys(s.pokedex.caught).length, level: s.trainer.level||1,
      champ: !!s.progress.championBeaten, tower: s.tower?.best||0,
    };
  }).filter(Boolean);

  const all = [...BOTS.map(b=>({ ...b, bot:true })), ...reals].sort((a,b)=>b.score-a.score);
  const myRank = all.findIndex(p=>p.me) + 1;

  mount(view,
    el('div', { class:'page-head' }, [
      el('h1', {}, 'Ranking de Treinadores'),
      el('p', { class:'page-sub' }, myRank>0 ? `Sua posição atual: #${myRank} de ${all.length}.` : 'Veja os melhores treinadores.'),
    ]),
    el('div', { class:'panel page-panel flush' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ CLASSIFICAÇÃO GERAL'), el('span',{class:'right mono',style:{fontSize:'8px'}}, 'PONTUAÇÃO = INSÍGNIAS·400 + CAPTURAS·40 + TORRE·120 + NÍVEL·60') ]),
      el('div', { class:'rk-list' }, all.map((p,i)=> rankRow(p, i+1))),
    ]),
  );

  function rankRow(p, pos){
    return el('div', { class:'rk-row'+(p.me?' me':'')+(pos<=3?' top':'') }, [
      el('div', { class:'rk-pos mono' }, pos<=3 ? ['🥇','🥈','🥉'][pos-1] : '#'+pos),
      el('div', { class:'rk-spr' }, [ trainerSpriteTile({ key:p.sprite, name:p.name, size:44 }) ]),
      el('div', { class:'rk-info' }, [
        el('div', { class:'rk-name' }, [ el('span',{}, p.name), p.me && el('span',{class:'rk-you mono'}, 'VOCÊ'), p.bot && el('span',{class:'rk-bot mono'}, 'CPU') ]),
        el('div', { class:'rk-meta mono dim' }, `Nv.${p.level} · ${p.badges} insígnias · ${p.caught} capturados${p.champ?' · ★ Campeão':''}${p.tower?` · Torre ${p.tower}`:''}`),
      ]),
      el('div', { class:'rk-score mono' }, p.score.toLocaleString('pt-BR')),
    ]);
  }
}
