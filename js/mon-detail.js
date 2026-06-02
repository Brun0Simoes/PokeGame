/* ============================================================
   mon-detail.js — full Pokémon summary + editor modal
   Summary · Stats (IV/EV/nature) · Moves (relearn)
   ============================================================ */

import { el, mount, button, toast, typeChip, confirmModal } from './ui.js';
import { audio } from './audio.js';
import { api, learnableMoves, fetchMove } from './api.js';
import { TYPE_COLOR, ITEMS } from './data.js';
import {
  STAT_KEYS, STAT_LABEL, STAT_SHORT, MAX_IV, MAX_EV_STAT, MAX_EV_TOTAL,
  NATURE_LIST, NATURE_NAMES_PT, NATURES, natureMod, recomputeStats,
  totalEVs, ivLabel,
} from './mon-stats.js';

const TYPE_LABEL = {
  normal:'NORMAL', fire:'FOGO', water:'ÁGUA', electric:'ELÉTRICO', grass:'GRAMA',
  ice:'GELO', fighting:'LUTA', poison:'VENENO', ground:'TERRA', flying:'VOADOR',
  psychic:'PSÍQUICO', bug:'INSETO', rock:'ROCHA', ghost:'FANTASMA', dragon:'DRAGÃO',
  dark:'NOTURNO', steel:'AÇO', fairy:'FADA',
};

/* openMonDetail(mon, ctx, { onClose }) */
export function openMonDetail(mon, ctx, opts={}){
  let tab = 'summary'; // summary | stats | moves
  const backdrop = el('div', { class:'modal-backdrop show mon-detail-backdrop' });
  const modal = el('div', { class:'modal mon-detail panel flush' });
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });

  function close(){
    backdrop.remove();
    opts.onClose && opts.onClose();
  }
  function save(){ ctx.saveAndSync(); }

  function render(){
    mount(modal,
      el('div', { class:'panel-bar' }, [
        el('span', { class:'dot' }),
        el('span', {}, '◢ ' + (mon.nickname || mon.name).toUpperCase()),
        el('span', { class:'right mono', style:{fontSize:'8px'} }, '#'+String(mon.id).padStart(3,'0')),
        el('button', { class:'panel-bar-close', onClick: close }, '✕'),
      ]),
      el('div', { class:'md-tabs' }, [
        mdTab('RESUMO', tab==='summary', ()=>{ tab='summary'; render(); }),
        mdTab('STATS · IV/EV', tab==='stats', ()=>{ tab='stats'; render(); }),
        mdTab('GOLPES', tab==='moves', ()=>{ tab='moves'; render(); }),
      ]),
      el('div', { class:'md-body' }, [
        tab==='summary' ? summaryView() :
        tab==='stats'   ? statsView() :
                          movesView(),
      ]),
    );
    if(tab==='moves') loadLearnable();
  }

  /* ---------- SUMMARY ---------- */
  function summaryView(){
    const types = mon.types || [];
    const accent = TYPE_COLOR[types[0]] || '#888';
    const sprite = mon.shiny ? (mon.sprite.shiny || mon.sprite.front) : mon.sprite.front;
    return el('div', { class:'md-summary' }, [
      el('div', { class:'md-portrait', style:{ background:`radial-gradient(ellipse at 50% 80%, ${accent}33, transparent 70%)` } }, [
        el('img', { src: sprite, alt: mon.name, style:{ imageRendering:'pixelated' } }),
        mon.shiny && el('div', { class:'md-shiny' }, '✦ SHINY'),
      ]),
      el('div', { class:'md-meta' }, [
        el('div', { class:'md-name-row' }, [
          el('span', { class:'md-name' }, (mon.nickname || mon.name).toUpperCase()),
          el('button', { class:'md-rename', title:'Renomear', onClick: ()=>renameMon() }, '✎'),
        ]),
        el('div', { class:'md-species mono dim' }, mon.name.toUpperCase() + ' · Lv. ' + mon.level),
        el('div', { class:'type-chips', style:{margin:'8px 0'} }, types.map(t=>typeChip(t))),
        el('div', { class:'md-info-grid' }, [
          infoCell('NATUREZA', NATURE_NAMES_PT[mon.nature] || mon.nature),
          infoCell('HABILIDADE', (mon.abilities?.[0] || '—').replace(/-/g,' ')),
          infoCell('ALTURA', (mon.height/10).toFixed(1)+' m'),
          infoCell('PESO', (mon.weight/10).toFixed(1)+' kg'),
          infoCell('POKÉBOLA', (mon.ball||'poke-ball').replace(/-/g,' ')),
          infoCell('ORIGEM', (mon.source||'—')),
        ]),
        el('div', { class:'md-hp-row' }, [
          el('span', { class:'mono', style:{fontSize:'9px',color:'var(--gold-deep)'} }, 'PS'),
          el('div', { class:'hp-bar '+(mon.hp/mon.maxHp<0.25?'low':mon.hp/mon.maxHp<0.5?'mid':'') }, [
            el('div', { class:'fill', style:{ width: Math.max(0,mon.hp/mon.maxHp*100)+'%' } }),
          ]),
          el('span', { class:'mono', style:{fontSize:'9px'} }, `${mon.hp}/${mon.maxHp}`),
        ]),
        heldRow(),
        tradeRow(),
      ]),
    ]);
  }

  function tradeRow(){
    return el('div', { class:'md-trade' }, [
      button({ label:'TROCAR (NPC) ▸', kind:'blue', onClick: ()=>doTrade() }),
      el('span', { class:'dim small', style:{marginLeft:'8px'} }, 'Pokémon que evoluem por troca evoluem ao trocar.'),
    ]);
  }
  async function doTrade(){
    const { tradeMon } = await import('./evolution.js');
    const r = await tradeMon(mon);
    if(r.evolved){
      const s = ctx.save;
      s.pokedex.seen[mon.id] = s.pokedex.caught[mon.id] = { name: mon.name, types: mon.types, sprite: mon.sprite.front, at: Date.now(), region: s.trainer.region, shiny: mon.shiny };
      save(); render();
    } else {
      toast('Este Pokémon não evolui por troca.', 'info');
    }
  }

  function heldRow(){
    const held = mon.held ? ITEMS[mon.held] : null;
    return el('div', { class:'md-held' }, [
      el('div', { class:'mono', style:{fontSize:'8px',color:'var(--ink-soft)',marginBottom:'5px'} }, 'ITEM SEGURADO'),
      held
        ? el('div', { class:'md-held-active' }, [
            el('span', { class:'md-held-name mono' }, held.name),
            el('span', { class:'md-held-desc' }, held.desc),
            el('button', { class:'md-held-rm', onClick: ()=>unequip() }, 'RETIRAR'),
          ])
        : el('button', { class:'md-held-empty', onClick: ()=>openHeldPicker() }, '+ Segurar item da Mochila'),
    ]);
  }
  function unequip(){
    if(!mon.held) return;
    const id = mon.held;
    ctx.save.bag.held[id] = (ctx.save.bag.held[id]||0) + 1;
    mon.held = null;
    audio.playSfx('cancel');
    save(); render();
  }
  function openHeldPicker(){
    const owned = Object.entries(ctx.save.bag.held||{}).filter(([id,q])=>q>0);
    if(owned.length === 0){ toast('Você não tem itens para segurar. Compre na Loja.', 'fail'); audio.playSfx('error'); return; }
    const bd = el('div', { class:'modal-backdrop show' });
    const m = el('div', { class:'modal panel' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ SEGURAR ITEM'), el('button',{class:'panel-bar-close', onClick:()=>cl()}, '✕') ]),
      el('div', { class:'panel-body' }, [
        el('div', { class:'held-pick' }, owned.map(([id,q])=>{
          const it = ITEMS[id];
          return el('button', { class:'held-pick-item', onClick: ()=>{ equip(id); cl(); } }, [
            el('div', {}, [ el('div', { class:'mono', style:{fontSize:'10px'} }, it.name), el('div', { class:'dim small' }, it.desc) ]),
            el('span', { class:'mono', style:{fontSize:'9px'} }, '× '+q),
          ]);
        })),
      ]),
    ]);
    bd.appendChild(m); document.body.appendChild(bd);
    bd.addEventListener('click', e=>{ if(e.target===bd) cl(); });
    function cl(){ bd.remove(); }
  }
  function equip(id){
    // return previous held to bag
    if(mon.held){ ctx.save.bag.held[mon.held] = (ctx.save.bag.held[mon.held]||0)+1; }
    ctx.save.bag.held[id] = Math.max(0, (ctx.save.bag.held[id]||0) - 1);
    if(ctx.save.bag.held[id] === 0) delete ctx.save.bag.held[id];
    mon.held = id;
    audio.playSfx('success');
    save(); render();
  }

  function renameMon(){
    const cur = mon.nickname || mon.name;
    const next = prompt('Apelido do Pokémon (máx 12):', cur);
    if(next == null) return;
    const trimmed = next.trim().slice(0,12);
    mon.nickname = trimmed || null;
    audio.playSfx('select');
    save(); render();
  }

  /* ---------- STATS / IV / EV (read-only + % calculadora) ---------- */
  function statsView(){
    const evTotal = totalEVs(mon.evs);
    const ivTotal = STAT_KEYS.reduce((a,k)=>a+(mon.ivs[k]||0),0);
    const ivPct = Math.round(ivTotal / (MAX_IV*6) * 100);
    const evPct = Math.round(evTotal / MAX_EV_TOTAL * 100);
    return el('div', { class:'md-stats' }, [
      el('div', { class:'md-stats-head' }, [
        el('div', { class:'mono', style:{fontSize:'9px',color:'var(--ink-soft)'} },
          `NATUREZA: ${(NATURE_NAMES_PT[mon.nature]||mon.nature).toUpperCase()}`),
        el('div', { class:'md-iv-overall' }, [
          el('span', { class:'mono', style:{fontSize:'8px',color:'var(--ink-soft)'} }, 'POTENCIAL (IV)'),
          el('span', { class:'md-iv-pct mono', style:{ color: pctColor(ivPct) } }, ivPct+'%'),
        ]),
      ]),
      el('div', { class:'md-stat-table' }, STAT_KEYS.map(k => statRow(k))),
      el('div', { class:'md-ev-foot' }, [
        el('div', { class:'md-calc-row' }, [
          el('div', { class:'md-calc-cell' }, [
            el('div', { class:'mono', style:{fontSize:'8px',color:'var(--gold-deep)'} }, `IV TOTAL ${ivTotal}/186`),
            el('div', { class:'md-calc-bar' }, [ el('div', { style:{ width:ivPct+'%', background:'linear-gradient(90deg,#5FE17C,#28A249)' } }) ]),
            el('div', { class:'mono', style:{fontSize:'8px'} }, ivPct+'% perfeito'),
          ]),
          el('div', { class:'md-calc-cell' }, [
            el('div', { class:'mono', style:{fontSize:'8px',color:'var(--gold-deep)'} }, `EV TOTAL ${evTotal}/${MAX_EV_TOTAL}`),
            el('div', { class:'md-calc-bar' }, [ el('div', { style:{ width:evPct+'%', background:'linear-gradient(90deg,var(--blue),var(--purple))' } }) ]),
            el('div', { class:'mono', style:{fontSize:'8px'} }, evPct+'% treinado'),
          ]),
        ]),
        el('p', { class:'dim small', style:{marginTop:'10px'} },
          'IV (0–31 por stat) é o potencial genético, sorteado na captura e fixo — não pode ser alterado. EV (0–252 por stat, máx 510) vem do treino: use Vitaminas e Penas da Loja para subir. A natureza dá +10%/−10% em dois stats.'),
      ]),
    ]);
  }

  function statRow(k){
    const natureUp = NATURES[mon.nature]?.[0] === k;
    const natureDown = NATURES[mon.nature]?.[1] === k;
    const val = mon.stats[k];
    const iv = mon.ivs[k];
    const ev = mon.evs[k];
    const ivp = Math.round(iv / MAX_IV * 100);
    const maxRef = 400;
    return el('div', { class:'md-stat-row ro' }, [
      el('div', { class:'msr-label mono'+(natureUp?' up':natureDown?' down':'') },
        STAT_SHORT[k] + (natureUp?' ▲':natureDown?' ▼':'')),
      el('div', { class:'msr-value mono' }, String(val)),
      el('div', { class:'msr-bar' }, [
        el('div', { class:'msr-bar-fill', style:{ width: Math.min(100, val/maxRef*100)+'%', background: barColor(val) } }),
      ]),
      el('div', { class:'msr-readout' }, [
        el('span', { class:'msr-chip', title:'Individual Value' }, [ el('b',{}, 'IV '), `${iv}/31` ]),
        el('span', { class:'msr-chip pct', style:{ color: pctColor(ivp) } }, ivp+'%'),
        el('span', { class:'msr-chip', title:'Effort Value' }, [ el('b',{}, 'EV '), `${ev}/252` ]),
      ]),
    ]);
  }
  function recompute(){
    recomputeStats(mon);
    audio.playSfx('click');
    save();
    render();
  }

  /* ---------- MOVES ---------- */
  function movesView(){
    return el('div', { class:'md-moves' }, [
      el('div', { class:'md-moves-current' }, [
        el('div', { class:'mono md-sub' }, 'GOLPES ATUAIS (máx 4)'),
        el('div', { class:'md-move-list' },
          (mon.moves||[]).length === 0
            ? [el('div', { class:'dim' }, 'Sem golpes.')]
            : mon.moves.map((mv,i)=>moveCard(mv, i))),
      ]),
      el('div', { class:'md-moves-learn' }, [
        el('div', { class:'mono md-sub' }, 'GOLPES DISPONÍVEIS (aprendíveis por nível)'),
        el('div', { class:'md-learn-list', id:'md-learn-list' }, [ el('div', { class:'dim mono small' }, 'Carregando…') ]),
      ]),
    ]);
  }
  function moveCard(mv, idx){
    return el('div', { class:'md-move-card t-'+mv.type }, [
      el('div', { class:'mmc-top' }, [
        el('span', { class:'mmc-name mono' }, mv.name.replace(/-/g,' ').toUpperCase()),
        el('button', { class:'mmc-del', title:'Esquecer golpe', onClick: ()=>forgetMove(idx) }, '✕'),
      ]),
      el('div', { class:'mmc-meta mono' }, [
        el('span', { class:'mmc-type' }, TYPE_LABEL[mv.type]||mv.type.toUpperCase()),
        el('span', {}, (mv.power||'—')+' POW'),
        el('span', {}, (mv.accuracy||'—')+'% PRE'),
        el('span', {}, mv.maxPp+' PP'),
        el('span', { class:'mmc-class' }, mv.damage_class==='special'?'ESP':mv.damage_class==='status'?'STA':'FÍS'),
      ]),
    ]);
  }
  function forgetMove(idx){
    if(mon.moves.length <= 1){ toast('Precisa ter ao menos 1 golpe.', 'fail'); return; }
    audio.playSfx('cancel');
    mon.moves.splice(idx,1);
    save(); render();
    loadLearnable();
  }
  async function loadLearnable(){
    const list = await learnableMoves(mon.id, mon.level);
    const container = modal.querySelector('#md-learn-list');
    if(!container) return;
    const known = new Set((mon.moves||[]).map(m=>m.name));
    const available = list.filter(l=>!known.has(l.name));
    if(available.length === 0){
      mount(container, el('div', { class:'dim mono small' }, 'Nenhum golpe novo disponível neste nível.'));
      return;
    }
    mount(container, ...available.map(l => el('button', {
      class:'md-learn-item',
      onClick: ()=>learnMove(l.name),
    }, [
      el('span', { class:'mono' }, l.name.replace(/-/g,' ').toUpperCase()),
      el('span', { class:'mono small dim' }, 'Nv. ' + l.lvl),
      el('span', { class:'ml-add mono' }, mon.moves.length>=4 ? 'SUBSTITUIR ▸' : '+ APRENDER'),
    ])));
  }
  async function learnMove(name){
    const mv = await fetchMove(name);
    if(!mv){ toast('Erro ao carregar golpe.', 'fail'); return; }
    if(mon.moves.length < 4){
      mon.moves.push(mv);
      audio.playSfx('success');
      save(); render(); loadLearnable();
    }else{
      // pick which to replace
      const idx = await pickReplace(mv);
      if(idx == null) return;
      mon.moves[idx] = mv;
      audio.playSfx('success');
      save(); render(); loadLearnable();
    }
  }
  function pickReplace(newMove){
    return new Promise(resolve=>{
      const bd = el('div', { class:'modal-backdrop show' });
      const m = el('div', { class:'modal panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ ESQUECER QUAL GOLPE?'), el('button',{class:'panel-bar-close', onClick:()=>cl(null)}, '✕') ]),
        el('div', { class:'panel-body' }, [
          el('p', { class:'dialog-msg' }, `Para aprender <b>${newMove.name.replace(/-/g,' ').toUpperCase()}</b>, escolha um golpe para esquecer:`),
          el('div', { class:'md-move-list' }, mon.moves.map((mv,i)=> el('button', {
            class:'md-replace-opt t-'+mv.type, onClick: ()=>cl(i),
          }, [
            el('span', { class:'mono' }, mv.name.replace(/-/g,' ').toUpperCase()),
            el('span', { class:'mono small dim' }, (TYPE_LABEL[mv.type]||mv.type)+' · '+(mv.power||'—')+' POW'),
          ]))),
        ]),
      ]);
      bd.appendChild(m); document.body.appendChild(bd);
      bd.addEventListener('click', e=>{ if(e.target===bd) cl(null); });
      function cl(v){ bd.remove(); resolve(v); }
    });
  }

  render();

  return { close };
}

function mdTab(label, active, onClick){
  return el('button', { class:'md-tab'+(active?' active':''), onClick: ()=>{ audio.playSfx('click'); onClick(); } }, label);
}
function infoCell(k, v){
  return el('div', { class:'md-info-cell' }, [
    el('div', { class:'mic-k mono' }, k),
    el('div', { class:'mic-v' }, String(v)),
  ]);
}
function barColor(v){
  if(v >= 140) return 'linear-gradient(90deg, #5FE17C, #28A249)';
  if(v >= 90)  return 'linear-gradient(90deg, #FFD24E, #C28E18)';
  if(v >= 50)  return 'linear-gradient(90deg, #FFA24E, #C26818)';
  return 'linear-gradient(90deg, #FF7062, #B72A1D)';
}
function pctColor(p){
  if(p >= 90) return '#28A249';
  if(p >= 70) return '#C28E18';
  if(p >= 40) return '#C26818';
  return '#B72A1D';
}
