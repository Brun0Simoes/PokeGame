/* ============================================================
   tabs/pokedex.js
   ============================================================ */

import { el, mount, button, typeChip } from '../ui.js';
import { audio } from '../audio.js';
import { api } from '../api.js';
import { REGIONS } from '../data.js';

export function renderPokedex(root, ctx){
  const { save } = ctx;
  const region = REGIONS.find(r=>r.id===save.trainer.region);

  let filter = 'all';     // all | caught | seen | shiny
  let view = el('div', { class:'tab-page pokedex-page' });
  mount(root, view);

  function refresh(){
    const caughtIds = Object.keys(save.pokedex.caught).map(Number);
    const seenIds = Object.keys(save.pokedex.seen).map(Number);
    const total = seenIds.length;

    let shown = [];
    if(filter==='caught') shown = caughtIds;
    else if(filter==='seen') shown = seenIds.filter(id=>!save.pokedex.caught[id]);
    else if(filter==='shiny') shown = caughtIds.filter(id=> isShiny(id, save));
    else shown = seenIds;

    shown.sort((a,b)=>a-b);

    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Pokédex Pessoal'),
        el('p', { class:'page-sub' }, `Treinadores capturam para sempre. Vistos em ${region?.name}: ${seenIds.length} · Capturados: ${caughtIds.length}`),
      ]),
      el('div', { class:'dex-controls panel page-panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span', {}, '◢ FILTROS') ]),
        el('div', { class:'panel-body row gap wrap' }, [
          chip('TODOS · '+seenIds.length, filter==='all', ()=>{ filter='all'; refresh(); }),
          chip('CAPTURADOS · '+caughtIds.length, filter==='caught', ()=>{ filter='caught'; refresh(); }),
          chip('SÓ VISTOS · '+(seenIds.length-caughtIds.length), filter==='seen', ()=>{ filter='seen'; refresh(); }),
          chip('SHINIES · '+caughtIds.filter(id=>isShiny(id, save)).length, filter==='shiny', ()=>{ filter='shiny'; refresh(); }),
        ]),
      ]),
      shown.length === 0
        ? el('div', { class:'empty panel page-panel' }, [
            el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ POKÉDEX VAZIA') ]),
            el('div', { class:'panel-body tight' }, [
              el('div', { class:'empty-icon' }, [ el('div', { class:'pokeball' }) ]),
              el('p', { class:'dim' }, 'Você ainda não viu nenhum Pokémon. Vá até Encontros Selvagens e gere um encontro!'),
              button({ label:'IR PARA ENCONTROS ▸', kind:'primary', onClick:()=>ctx.go('/game/wild') }),
            ]),
          ])
        : el('div', { class:'dex-grid' }, shown.map(id => dexCell(id, save)))
    );
  }

  refresh();

  function chip(label, active, onClick){
    return el('button', { class:'filter-chip'+(active?' active':''), onClick: ()=>{ audio.playSfx('click'); onClick(); } }, label);
  }
}

function isShiny(id, save){ return !!save.pokedex.caught[id]?.shiny; }

function dexCell(id, save){
  const caught = save.pokedex.caught[id];
  const seen = save.pokedex.seen[id];
  const data = caught || seen;
  if(!data) return null;
  const captured = !!caught;
  return el('button', {
    class:'dex-cell'+(captured?' captured':' seen-only')+(caught?.shiny?' shiny':''),
    onClick: ()=>{ audio.playSfx('select'); openDetail(id, data, captured); },
  }, [
    el('span', { class:'dex-num' }, '#'+String(id).padStart(3,'0')),
    el('div', { class:'dex-art' }, [
      el('img', { src: data.sprite, alt: data.name, style:{ imageRendering:'pixelated', filter: captured?'none':'brightness(0)' } }),
    ]),
    el('div', { class:'dex-name' }, captured ? data.name : '???'),
    el('div', { class:'dex-types' }, (data.types||[]).map(t=>typeChip(t))),
    caught?.shiny ? el('div', { class:'dex-shiny' }, '✦') : null,
  ]);
}

async function openDetail(id, data, captured){
  const backdrop = el('div', { class:'modal-backdrop show' });
  const body = el('div', { class:'modal panel pokedex-detail' }, [
    el('div', { class:'panel-bar' }, [
      el('span',{class:'dot'}),
      el('span', {}, '◢ POKÉDEX'),
      el('span', { class:'right' }, '#'+String(id).padStart(3,'0')),
      el('button', { class:'panel-bar-close', onClick:()=>close() }, '✕'),
    ]),
    el('div', { class:'panel-body tight' }, [
      el('div', { class:'pd-loading' }, [ el('span',{class:'spinner'}), 'Carregando dados...' ]),
    ]),
  ]);
  backdrop.appendChild(body);
  document.body.appendChild(backdrop);
  function close(){ backdrop.remove(); }
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });

  if(!captured){
    body.querySelector('.panel-body').innerHTML =
      `<div class="empty-icon"><div class="pokeball"></div></div>
       <p class="dim center">Você ainda não capturou este Pokémon. Capture-o para ver os dados completos.</p>`;
    return;
  }

  try{
    const p = await api.getPokemon(id);
    const species = await api.getSpecies(id);
    const flavor = (species?.flavor_text_entries || []).find(e=>e.language?.name==='en')?.flavor_text?.replace(/[\f\n\r]/g,' ') || '—';
    const body2 = body.querySelector('.panel-body');
    body2.innerHTML = '';
    body2.appendChild(el('div', { class:'pd-grid' }, [
      el('div', { class:'pd-art' }, [
        el('img', { src: data.sprite, alt: data.name, style:{ imageRendering:'pixelated' } }),
      ]),
      el('div', { class:'pd-info' }, [
        el('div', { class:'pd-name' }, data.name.toUpperCase() + (data.shiny?' ✦':'')),
        el('div', { class:'pd-types' }, (data.types||[]).map(t=>typeChip(t))),
        el('div', { class:'pd-flavor' }, flavor),
        el('div', { class:'pd-meta' }, [
          metaCell('ALT', (p.height/10).toFixed(1)+'m'),
          metaCell('PESO', (p.weight/10).toFixed(1)+'kg'),
          metaCell('CAPT.', new Date(data.at).toLocaleDateString('pt-BR')),
        ]),
        el('div', { class:'pd-stats' }, p.stats.map(s => statBar(stLabel(s.stat.name), s.base_stat))),
      ]),
    ]));
  }catch(err){
    body.querySelector('.panel-body').innerHTML = `<p>Erro: ${err.message}</p>`;
  }
}

function stLabel(n){ return { hp:'PS', attack:'ATQ', defense:'DEF', 'special-attack':'AT.ES', 'special-defense':'DF.ES', speed:'VEL' }[n] || n.toUpperCase(); }
function metaCell(k,v){ return el('div', { class:'pd-meta-cell' }, [ el('div', { class:'k' }, k), el('div', { class:'v' }, v) ]); }
function statBar(lbl,v){
  return el('div', { class:'pd-stat' }, [
    el('span', { class:'l' }, lbl),
    el('div', { class:'bar' }, [ el('div', { style:{ width: Math.min(100, v/200*100)+'%' } }) ]),
    el('span', { class:'v' }, v),
  ]);
}
