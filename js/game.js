/* ============================================================
   game.js — main game shell with sidebar + tabs
   ============================================================ */

import { Store } from './storage.js';
import { REGIONS } from './data.js';
import { audio } from './audio.js';
import { go, currentRoute } from './router.js';
import { $, el, mount, toast } from './ui.js';
import { ensureTrainerProgress, trainerExpProgress } from './trainer.js';
import {
  renderWild, renderProfile, renderTeam, renderPC, renderShop, renderTrainers, renderGyms, renderElite,
  renderBag, renderPokeCenter, renderPokedex, renderTravel, renderSettings, renderOnline, renderQuests, renderDaycare, renderTower, renderRanking,
} from './tabs.js';

const TABS = [
  { id:'wild',       label:'Encontros Selvagens', icon: iconGrass(), mood:'route' },
  { id:'profile',    label:'Perfil',              icon: iconProfile(), mood:'route' },
  { id:'team',       label:'Minha Equipe',        icon: iconTeam(),    mood:'route' },
  { id:'pc',         label:'PC de Bill',          icon: iconPC(),      mood:'route' },
  { id:'trainers',   label:'Treinadores (NPC)',   icon: iconSwords(),  mood:'battle' },
  { id:'gyms',       label:'Ginásios',            icon: iconBadge(),   mood:'gym' },
  { id:'elite',      label:'Elite 4 & Campeão',   icon: iconCrown(),   mood:'gym' },
  { id:'bag',        label:'Mochila',             icon: iconBag(),     mood:'route' },
  { id:'shop',       label:'Loja',                icon: iconShop(),    mood:'route' },
  { id:'pokecenter', label:'Centro Pokémon',      icon: iconHeart(),   mood:'center' },
  { id:'pokedex',    label:'Pokédex',             icon: iconBook(),    mood:'route' },
  { id:'travel',     label:'Viajar',              icon: iconMap(),     mood:'route' },
  { id:'quests',     label:'Missões',             icon: iconQuests(),  mood:'route' },
  { id:'daycare',    label:'Day-Care',            icon: iconEgg(),     mood:'center' },
  { id:'tower',      label:'Torre de Batalha',    icon: iconTower(),   mood:'gym' },
  { id:'ranking',    label:'Ranking',             icon: iconRank(),    mood:'route' },
  { id:'online',     label:'Liga Online',         icon: iconOnline(),  mood:'battle' },
  { id:'settings',   label:'Configurações',       icon: iconCog(),     mood:'route' },
];

let _shell = null;
let _disposeCurrentTab = null;

export function renderGame(root, route){
  // route is like "/game/<tab>"
  const parts = route.split('/').filter(Boolean);
  const tabId = parts[1] || 'wild';
  const tab = TABS.find(t=>t.id===tabId) || TABS[0];

  const acc = Store.currentAccount();
  const save = acc ? Store.getSave(acc.email) : null;

  if(!acc || !save){
    go('/login');
    return;
  }
  ensureTrainerProgress(save);

  // first-run tutorial
  if(!save.tutorialDone){
    import('./tutorial.js').then(t=>t.maybeShowTutorial(save, { save, saveAndSync(){ Store.setSave(acc.email, save); } }));
  }

  if(!_shell){
    _shell = buildShell(acc, save);
    mount(root, _shell);
  }else{
    // ensure shell is mounted (in case router swapped views)
    if(_shell.parentNode !== root){ mount(root, _shell); }
    syncShell(acc, save);
  }

  // Switch music mood
  audio.setRegion && audio.setRegion(save.trainer.region);
  if(audio.musicOn) audio.startMusic(tab.mood);

  // Highlight active tab
  $('.sidebar', _shell).querySelectorAll('.sb-item').forEach(item=>{
    item.classList.toggle('active', item.dataset.tab===tab.id);
  });

  // Dispose previous tab if needed
  if(_disposeCurrentTab){ try{ _disposeCurrentTab(); }catch{} _disposeCurrentTab = null; }
  const tabRoot = $('.tab-container', _shell);
  mount(tabRoot, el('div', { class:'tab-loading' }, [ el('span',{class:'spinner'}), 'Carregando...' ]));

  const ctx = {
    account: acc,
    save,
    saveAndSync(){
      Store.setSave(acc.email, save);
      syncShell(acc, save);
    },
    go,
    toast,
  };
  Promise.resolve(getTabRenderer(tab.id)(tabRoot, ctx)).then(dispose=>{
    _disposeCurrentTab = typeof dispose === 'function' ? dispose : null;
  }).catch(err=>{
    console.error('[tab error]', err);
    mount(tabRoot, el('div',{class:'tab-error panel'}, [ el('div',{class:'panel-bar'},'⚠ ERRO NA ABA'), el('div',{class:'tight'}, err.message || String(err)) ]));
  });
}

function getTabRenderer(id){
  return ({
    wild: renderWild, profile: renderProfile, team: renderTeam, pc: renderPC,
    trainers: renderTrainers, gyms: renderGyms, elite: renderElite,
    bag: renderBag, pokecenter: renderPokeCenter, pokedex: renderPokedex,
    shop: renderShop,
    travel: renderTravel, settings: renderSettings,
    quests: renderQuests,
    daycare: renderDaycare,
    tower: renderTower,
    ranking: renderRanking,
    online: renderOnline,
  })[id] || renderWild;
}

function buildShell(acc, save){
  const region = REGIONS.find(r=>r.id===save.trainer.region);
  return el('div', { class:'game-shell' }, [
    el('aside', { class:'sidebar' }, [
      el('div', { class:'sb-header' }, [
        el('div', { class:'sb-pokeball' }),
        el('div', { class:'sb-title' }, [
          el('div', { class:'sb-name', text: save.trainer.name }),
          el('div', { class:'sb-id' },   `ID ${String(save.trainer.id).padStart(5,'0')}`),
        ]),
        el('div', { class:'sb-lvl-badge' }, [
          el('span', { class:'sb-lvl-cap' }, 'NV'),
          el('span', { class:'sb-lvl-num' }, String(save.trainer.level)),
        ]),
      ]),
      trainerExpBar(save),
      el('div', { class:'sb-region' }, [
        el('span', { class:'sb-region-dot', style:{ background: region?.color || '#888' } }),
        el('div', {}, [
          el('div', { class:'sb-region-label' }, 'REGIÃO ATUAL'),
          el('div', { class:'sb-region-name' }, region?.name?.toUpperCase() || '—'),
        ]),
      ]),
      el('nav', { class:'sb-nav' }, TABS.map(t => el('button', {
        class:'sb-item',
        dataset:{ tab: t.id },
        onClick: ()=>{ audio.playSfx('select'); go('/game/'+t.id); }
      }, [
        el('span', { class:'sb-ic' }, t.icon),
        el('span', { class:'sb-lbl' }, t.label),
        el('span', { class:'sb-arrow' }, '▸'),
      ]))),
      el('div', { class:'sb-stats' }, [
        statBar('PD', '₽' + save.trainer.money.toLocaleString('pt-BR'), 'money'),
        statBar('PARTY', `${save.party.length}/6`, 'party'),
        statBar('CAPTURADOS', Object.keys(save.pokedex.caught).length, 'caught'),
        statBar('BADGES', `${save.progress.gymsBeaten.length}/8`, 'badges'),
      ]),
      el('div', { class:'sb-foot' }, [
        el('button', { class:'sb-foot-btn', onClick: ()=>{ audio.toggleMusic(); $('#sb-music-led').classList.toggle('on', audio.musicOn); } },
           [ el('span', { id:'sb-music-led', class:'led'+(audio.musicOn?' on':'') }), '♪ MUSIC' ]),
        el('button', { class:'sb-foot-btn', onClick: ()=>{ audio.setSfxOn(!audio.sfxOn); audio.playSfx('click'); $('#sb-sfx-led').classList.toggle('on', audio.sfxOn); } },
           [ el('span', { id:'sb-sfx-led', class:'led'+(audio.sfxOn?' on':'') }), 'SFX' ]),
        el('button', { class:'sb-foot-btn warn', onClick: ()=>{ Store.logout(); audio.playSfx('cancel'); _shell = null; go('/login'); } },
           [ el('span', { class:'led' }), 'SAIR' ]),
      ]),
    ]),
    el('main', { class:'game-main' }, [
      el('div', { class:'tab-container' }),
    ]),
  ]);
}

function statBar(label, value, kind){
  return el('div', { class:'sb-stat sb-stat-'+kind }, [
    el('span', { class:'sb-stat-l' }, label),
    el('span', { class:'sb-stat-v' }, String(value)),
  ]);
}

function trainerExpBar(save){
  const p = trainerExpProgress(save);
  return el('div', { class:'sb-exp' }, [
    el('div', { class:'sb-exp-bar' }, [ el('div', { class:'sb-exp-fill', style:{ width: (p.pct*100)+'%' } }) ]),
    el('span', { class:'sb-exp-v', style:{ display:'none' } }, p.max ? 'MÁX' : `${p.into}/${p.span}`),
  ]);
}

function syncShell(acc, save){
  const sb = $('.sidebar', _shell);
  if(!sb) return;
  ensureTrainerProgress(save);
  $('.sb-name', sb).textContent = save.trainer.name;
  const region = REGIONS.find(r=>r.id===save.trainer.region);
  $('.sb-region-name', sb).textContent = region?.name?.toUpperCase() || '—';
  $('.sb-region-dot', sb).style.background = region?.color || '#888';
  const lvlNum = $('.sb-lvl-num', sb);
  if(lvlNum) lvlNum.textContent = String(save.trainer.level);
  const p = trainerExpProgress(save);
  const fill = $('.sb-exp-fill', sb);
  if(fill) fill.style.width = (p.pct*100)+'%';
  const expV = $('.sb-exp-v', sb);
  if(expV) expV.textContent = p.max ? 'MÁX' : `${p.into}/${p.span}`;
  const statEls = sb.querySelectorAll('.sb-stat .sb-stat-v');
  if(statEls[0]) statEls[0].textContent = '₽' + save.trainer.money.toLocaleString('pt-BR');
  if(statEls[1]) statEls[1].textContent = `${save.party.length}/6`;
  if(statEls[2]) statEls[2].textContent = Object.keys(save.pokedex.caught).length;
  if(statEls[3]) statEls[3].textContent = `${save.progress.gymsBeaten.length}/8`;
}

export function clearShell(){
  _shell = null;
  if(_disposeCurrentTab){ try{ _disposeCurrentTab(); }catch{} _disposeCurrentTab = null; }
}

/* ---- SVG icons ---- */
function svg(d, extra=''){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}><path d="${d}"/></svg>`;
}
function iconGrass(){ return wrapSvg('M3 19c4 0 4-12 9-12s5 12 9 12'); }
function iconSwords(){ return wrapSvg('M14 14 22 6 M16 4h4v4 M12 12 4 20 M8 22H4v-4 M10 14l4 4 M14 10l4-4'); }
function iconBadge(){ return wrapSvg('M12 2l3 6 6 1-4.5 4 1 6L12 16l-5.5 3 1-6L3 9l6-1z'); }
function iconCrown(){ return wrapSvg('M3 18h18 M5 18l-1-9 5 5 3-7 3 7 5-5-1 9'); }
function iconBag(){ return wrapSvg('M6 6h12l-1 14H7zM9 6V4h6v2'); }
function iconHeart(){ return wrapSvg('M21 8.5a5.5 5.5 0 0 0-9-4 5.5 5.5 0 0 0-9 4c0 6 9 11 9 11s9-5 9-11z'); }
function iconBook(){ return wrapSvg('M3 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15H6a2 2 0 0 1-2-2zM20 18H7'); }
function iconCog(){ return wrapSvg('M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-3 3l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-3-3l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 3-3l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 3 3l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'); }
function iconMap(){ return wrapSvg('M3 7l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 5v14M15 7v14'); }
function iconOnline(){ return wrapSvg('M5 12.5a7 7 0 0 1 14 0 M8 15a4 4 0 0 1 8 0 M12 18h.01 M2 9.5a11 11 0 0 1 20 0'); }
function iconQuests(){ return wrapSvg('M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'); }
function iconEgg(){ return wrapSvg('M12 3c3 0 6 5 6 10a6 6 0 0 1-12 0c0-5 3-10 6-10z'); }
function iconTower(){ return wrapSvg('M6 21V8l6-5 6 5v13 M10 21v-5h4v5 M9 11h.01 M15 11h.01'); }
function iconRank(){ return wrapSvg('M4 20h4v-8H4z M10 20h4V4h-4z M16 20h4v-5h-4z'); }
function iconTeam(){ return wrapSvg('M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20a6 6 0 0 1 12 0 M17 11l2 2 4-4'); }
function iconProfile(){ return wrapSvg('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0'); }
function iconPC(){ return wrapSvg('M4 4h16v12H4z M2 20h20 M9 16v4 M15 16v4 M8 8h3 M8 11h6'); }
function iconShop(){ return wrapSvg('M3 9l2-5h14l2 5M3 9h18v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 12v8h14v-8'); }
function wrapSvg(d){
  const span = document.createElement('span');
  span.innerHTML = svg(d);
  return span;
}
