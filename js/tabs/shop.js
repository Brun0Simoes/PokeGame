/* ============================================================
   tabs/shop.js — Poké Mart: buy items across all categories
   ============================================================ */

import { el, mount, button, toast } from '../ui.js';
import { audio } from '../audio.js';
import { ITEMS } from '../data.js';

const CATS = [
  { id:'ball',     label:'POKÉBOLAS', bagKey:'balls'    },
  { id:'med',      label:'MEDICINA',  bagKey:'medicine' },
  { id:'ev',       label:'VITAMINAS', bagKey:'ev'       },
  { id:'held',     label:'P/ SEGURAR',bagKey:'held'     },
  { id:'mega',     label:'MEGA PEDRAS',bagKey:'mega'    },
  { id:'zcrystal', label:'CRISTAIS Z',bagKey:'zcrystal' },
  { id:'tm',       label:'TMs / HMs', bagKey:'tm'       },
  { id:'evo',      label:'PEDRAS EVOLUTIVAS', bagKey:'evo' },
];

export function renderShop(root, ctx){
  const { save } = ctx;
  let cat = 'ball';

  const view = el('div', { class:'tab-page shop-page' });
  mount(root, view);
  refresh();

  function refresh(){
    const def = CATS.find(c=>c.id===cat);
    const items = Object.values(ITEMS).filter(it => it.cat === cat && (it.price > 0 || cat==='tm'));
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Poké Mart'),
        el('p', { class:'page-sub' }, `Saldo: ₽ ${save.trainer.money.toLocaleString('pt-BR')}. Compre tudo o que precisar para sua jornada.`),
      ]),
      el('div', { class:'shop-layout' }, [
        // category rail
        el('div', { class:'shop-cats panel page-panel flush' },
          CATS.map(c => el('button', {
            class:'shop-cat'+(cat===c.id?' active':''),
            onClick: ()=>{ cat=c.id; audio.playSfx('select'); refresh(); },
          }, [
            el('span', { class:'sc-ic' }, [ catIcon(c.id) ]),
            el('span', { class:'sc-lbl mono' }, c.label),
            el('span', { class:'sc-arrow' }, '▸'),
          ]))
        ),
        // item list
        el('div', { class:'shop-list panel page-panel' }, [
          el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ '+def.label), el('span', { class:'right mono', style:{fontSize:'8px'} }, `₽ ${save.trainer.money.toLocaleString('pt-BR')}`) ]),
          items.length === 0
            ? el('div', { class:'panel-body tight center' }, [ el('p',{class:'dim'}, 'Nada nesta categoria.') ])
            : el('div', { class:'shop-items' }, items.map(it => shopRow(it, def.bagKey))),
        ]),
      ]),
    );
  }

  function owned(it, bagKey){
    const b = save.bag[bagKey] || {};
    return b[it.id] || 0;
  }

  function shopRow(it, bagKey){
    const have = owned(it, bagKey);
    return el('div', { class:'shop-row' }, [
      el('div', { class:'shr-ic' }, [ itemThumb(it) ]),
      el('div', { class:'shr-info' }, [
        el('div', { class:'shr-name mono' }, it.name + (have ? `  ×${have}` : '')),
        el('div', { class:'shr-desc' }, it.desc),
      ]),
      el('div', { class:'shr-buy' }, [
        el('div', { class:'shr-price mono' }, '₽'+it.price.toLocaleString('pt-BR')),
        button({ label:'COMPRAR', kind:'primary', onClick: ()=>buy(it, bagKey) }),
      ]),
    ]);
  }

  function buy(it, bagKey){
    if(save.trainer.money < it.price){
      audio.playSfx('error'); toast('Pokédollars insuficientes.', 'fail'); return;
    }
    save.trainer.money -= it.price;
    if(!save.bag[bagKey]) save.bag[bagKey] = {};
    save.bag[bagKey][it.id] = (save.bag[bagKey][it.id]||0) + 1;
    audio.playSfx('success');
    toast(`+1 ${it.name}`, 'success');
    ctx.saveAndSync();
    refresh();
  }
}

/* ---- icons / thumbs ---- */
function catIcon(id){
  const map = {
    ball:'#DC3545', med:'#FF8AA0', ev:'#79DAF7', held:'#5FE17C',
    mega:'#B080FF', zcrystal:'#F2B939', tm:'#2D5BD1',
  };
  return svgEl(`<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="9" fill="${map[id]||'#888'}" stroke="#1B2154" stroke-width="2"/></svg>`);
}
function itemThumb(it){
  if(it.cat==='ball'){
    const c = it.color || '#DC3545';
    const d = document.createElement('div');
    d.className = 'ball3d-mini';
    d.style.setProperty('--ball-color', c);
    d.innerHTML = `<div class="b3m-shine"></div><div class="b3m-btn"></div>`;
    return d;
  }
  if(it.cat==='mega'){
    return svgEl(`<svg viewBox="0 0 32 32"><polygon points="16,3 27,12 22,28 10,28 5,12" fill="#B080FF" stroke="#1B2154" stroke-width="2" stroke-linejoin="round"/><polygon points="16,9 21,14 18,22 14,22 11,14" fill="#E0C9FF"/></svg>`);
  }
  if(it.cat==='zcrystal'){
    return svgEl(`<svg viewBox="0 0 32 32"><polygon points="16,4 26,16 16,28 6,16" fill="#F2B939" stroke="#1B2154" stroke-width="2" stroke-linejoin="round"/></svg>`);
  }
  if(it.cat==='ev'){
    return svgEl(`<svg viewBox="0 0 32 32"><rect x="11" y="3" width="10" height="5" fill="#1B2154"/><path d="M9 8h14l-1 18a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#79DAF7" stroke="#1B2154" stroke-width="2"/></svg>`);
  }
  if(it.cat==='held'){
    return svgEl(`<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="#5FE17C" stroke="#1B2154" stroke-width="2"/><circle cx="16" cy="16" r="4" fill="#FFFCEC" stroke="#1B2154" stroke-width="2"/></svg>`);
  }
  if(it.cat==='tm'){
    return svgEl(`<svg viewBox="0 0 32 32"><rect x="4" y="9" width="24" height="14" rx="2" fill="#2D5BD1" stroke="#1B2154" stroke-width="2"/><circle cx="24" cy="16" r="2.5" fill="#FFFCEC"/></svg>`);
  }
  if(it.cat==='evo'){
    const c = { 'fire-stone':'#EE5533','water-stone':'#5599EE','thunder-stone':'#F7D02C','leaf-stone':'#5FBF4C','moon-stone':'#9B8Fd0','sun-stone':'#FF9D2E','shiny-stone':'#F2E7B0','dusk-stone':'#5A4A6A','dawn-stone':'#7FC8E0','ice-stone':'#A6E0E8','oval-stone':'#E8DFC0' }[it.id] || '#79DAF7';
    return svgEl(`<svg viewBox="0 0 32 32"><polygon points="16,4 26,14 21,27 11,27 6,14" fill="${c}" stroke="#1B2154" stroke-width="2" stroke-linejoin="round"/><polygon points="16,9 21,14 18,22 14,22 11,14" fill="rgba(255,255,255,0.5)"/></svg>`);
  }
  // med default
  return svgEl(`<svg viewBox="0 0 32 32"><path d="M9 6h14l-1 20a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#FF8AA0" stroke="#1B2154" stroke-width="2"/></svg>`);
}
function svgEl(s){ const d = document.createElement('div'); d.innerHTML = s; d.style.cssText='width:100%;height:100%'; return d; }
