/* ============================================================
   tabs/team.js — manage the active party (max 6)
   Reorder, inspect/edit, send to PC, set lead.
   ============================================================ */

import { el, mount, button, toast } from '../ui.js';
import { audio } from '../audio.js';
import { TYPE_COLOR } from '../data.js';
import { STAT_KEYS, STAT_SHORT } from '../mon-stats.js';
import { openMonDetail } from '../mon-detail.js';

export function renderTeam(root, ctx){
  const { save } = ctx;
  let dragFrom = null;
  const view = el('div', { class:'tab-page team-page' });
  mount(root, view);
  refresh();

  function refresh(){
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Minha Equipe'),
        el('p', { class:'page-sub' },
          `${save.party.length}/6 Pokémon na equipe. Clique para ver detalhes, editar golpes, IVs, EVs e natureza. O primeiro da lista é o líder que entra em batalha.`),
      ]),
      save.party.length === 0
        ? emptyState(ctx)
        : el('div', { class:'team-grid' }, save.party.map((mon, i) => teamCard(mon, i, ctx, refresh))),
      el('div', { class:'panel page-panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ AÇÕES') ]),
        el('div', { class:'panel-body row gap wrap' }, [
          button({ label:'IR PARA O PC ▸', kind:'blue', onClick: ()=>ctx.go('/game/pc') }),
          button({ label:'CURAR NO CENTRO ▸', kind:'ghost', onClick: ()=>ctx.go('/game/pokecenter') }),
        ]),
      ]),
    );
  }

  function teamCard(mon, idx, ctx, refresh){
    const types = mon.types || [];
    const accent = TYPE_COLOR[types[0]] || '#888';
    const sprite = mon.shiny ? (mon.sprite.shiny || mon.sprite.front) : mon.sprite.front;
    const fainted = mon.hp <= 0;
    const card = el('div', { class:'team-card panel'+(idx===0?' lead':'')+(fainted?' fainted':''),
      draggable: true, dataset:{ idx: String(idx) } }, [
      el('div', { class:'tm-rank mono' }, idx===0 ? 'LÍDER' : '#'+(idx+1)),
      el('div', { class:'tm-grip', title:'Arraste para reordenar' }, '⠿'),
      el('button', { class:'tm-main', onClick: ()=>openMonDetail(mon, ctx, { onClose: refresh }) }, [
        el('div', { class:'tm-art', style:{ background:`radial-gradient(ellipse at 50% 85%, ${accent}33, transparent 70%)` } }, [
          el('img', { src: sprite, alt: mon.name, style:{ imageRendering:'pixelated' } }),
          mon.shiny && el('span', { class:'tm-shiny' }, '✦'),
        ]),
        el('div', { class:'tm-info' }, [
          el('div', { class:'tm-name mono' }, (mon.nickname || mon.name).toUpperCase()),
          el('div', { class:'tm-lvl mono dim' }, 'Lv. ' + mon.level),
          el('div', { class:'type-chips', style:{justifyContent:'center',margin:'4px 0'} }, types.map(t=>typeChip(t))),
          el('div', { class:'tm-hp' }, [
            el('div', { class:'hp-bar '+(mon.hp/mon.maxHp<0.25?'low':mon.hp/mon.maxHp<0.5?'mid':'') }, [
              el('div', { class:'fill', style:{ width: Math.max(0,mon.hp/mon.maxHp*100)+'%' } }),
            ]),
            el('span', { class:'mono', style:{fontSize:'8px'} }, `${mon.hp}/${mon.maxHp}`),
          ]),
          el('div', { class:'tm-stats mono' }, STAT_KEYS.map(k =>
            el('span', { class:'tm-stat' }, [ el('b', {}, STAT_SHORT[k]), ' ', String(mon.stats[k]) ]))),
        ]),
        el('div', { class:'tm-edit-hint mono' }, 'VER / EDITAR ▸'),
      ]),
      el('div', { class:'tm-actions' }, [
        el('button', { class:'tm-act', disabled: idx===0, title:'Subir', onClick: ()=>move(idx,-1) }, '▲'),
        el('button', { class:'tm-act', disabled: idx===save.party.length-1, title:'Descer', onClick: ()=>move(idx,1) }, '▼'),
        el('button', { class:'tm-act', disabled: idx===0, title:'Tornar líder', onClick: ()=>makeLead(idx) }, '★'),
        el('button', { class:'tm-act warn', disabled: save.party.length<=1, title:'Mandar pro PC', onClick: ()=>toBox(idx) }, '⇩PC'),
      ]),
    ]);
    // drag-and-drop reorder
    card.addEventListener('dragstart', e=>{ dragFrom = idx; card.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
    card.addEventListener('dragend', ()=>{ dragFrom = null; document.querySelectorAll('.team-card').forEach(c=>c.classList.remove('dragging','drop-target')); });
    card.addEventListener('dragover', e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; card.classList.add('drop-target'); });
    card.addEventListener('dragleave', ()=>card.classList.remove('drop-target'));
    card.addEventListener('drop', e=>{ e.preventDefault(); card.classList.remove('drop-target'); reorder(dragFrom, idx); });
    return card;
  }

  function reorder(from, to){
    if(from == null || to == null || from === to) return;
    const arr = save.party;
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    audio.playSfx('select');
    ctx.saveAndSync(); refresh();
  }

  function move(idx, dir){
    const ni = idx + dir;
    if(ni < 0 || ni >= save.party.length) return;
    const arr = save.party;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    audio.playSfx('select');
    ctx.saveAndSync(); refresh();
  }
  function makeLead(idx){
    const [m] = save.party.splice(idx,1);
    save.party.unshift(m);
    audio.playSfx('select');
    ctx.saveAndSync(); refresh();
  }
  function toBox(idx){
    if(save.party.length <= 1){ toast('A equipe precisa de ao menos 1 Pokémon.', 'fail'); audio.playSfx('error'); return; }
    const [m] = save.party.splice(idx,1);
    save.box.unshift(m);
    audio.playSfx('cancel');
    toast(`${(m.nickname||m.name).toUpperCase()} foi para o PC.`, 'info');
    ctx.saveAndSync(); refresh();
  }
}

function typeChip(t){
  return el('span', { class:'type-chip t-'+t }, t);
}
function emptyState(ctx){
  return el('div', { class:'panel page-panel' }, [
    el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ EQUIPE VAZIA') ]),
    el('div', { class:'panel-body tight center' }, [
      el('div', { class:'empty-icon' }, [ el('div',{class:'pokeball'}) ]),
      el('p', { class:'dim' }, 'Você não tem Pokémon na equipe. Pegue alguns no PC ou capture na grama.'),
      button({ label:'ABRIR PC ▸', kind:'primary', onClick: ()=>ctx.go('/game/pc') }),
    ]),
  ]);
}
