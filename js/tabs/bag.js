/* ============================================================
   tabs/bag.js
   ============================================================ */

import { el, mount, button, toast, confirmModal } from '../ui.js';
import { audio } from '../audio.js';
import { ITEMS } from '../data.js';

export function renderBag(root, ctx){
  const { save } = ctx;
  let cat = 'balls';

  const view = el('div', { class:'tab-page bag-page' });
  mount(root, view);

  const CATS = [
    { id:'balls',    lbl:'POKÉBOLAS' },
    { id:'medicine', lbl:'MEDICINA'  },
    { id:'ev',       lbl:'VITAMINAS' },
    { id:'held',     lbl:'P/ SEGURAR'},
    { id:'mega',     lbl:'MEGA PEDRAS'},
    { id:'zcrystal', lbl:'CRISTAIS Z'},
    { id:'tm',       lbl:'TMs / HMs' },
    { id:'evo',      lbl:'PEDRAS EVO' },
    { id:'key',      lbl:'CHAVE'     },
  ];

  refresh();

  function refresh(){
    const items = listByCategory(save, cat);
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Mochila'),
        el('p', { class:'page-sub' }, `Carteira: ₽ ${save.trainer.money.toLocaleString('pt-BR')}.`),
      ]),
      el('div', { class:'bag-layout' }, [
        el('div', { class:'bag-cats panel page-panel flush' },
          CATS.map(c => catBtn(c.lbl, catCount(save, c.id), cat===c.id, ()=>{ cat=c.id; refresh(); }))
        ),
        el('div', { class:'bag-list panel page-panel' }, [
          el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span', {}, '◢ '+catLabel(cat).toUpperCase()) ]),
          items.length === 0
            ? el('div', { class:'panel-body tight center' }, [
                el('div', { class:'empty-icon' }, [ el('div', { class:'pokeball' }) ]),
                el('p', { class:'dim' }, `Você não tem ${catLabel(cat).toLowerCase()} ainda. Compre na Loja.`),
                button({ label:'IR PARA A LOJA ▸', kind:'primary', onClick: ()=>ctx.go('/game/shop') }),
              ])
            : el('div', { class:'bag-items' }, items.map(it => itemRow(it, ctx, refresh))),
        ]),
      ]),
    );
  }

  function catBtn(lbl, count, active, onClick){
    return el('button', { class:'bag-cat'+(active?' active':''), onClick:()=>{ audio.playSfx('select'); onClick(); } }, [
      el('span', { class:'bc-ic' }, [ catSvg(lbl) ]),
      el('div', {}, [
        el('div', { class:'bc-lbl' }, lbl),
        el('div', { class:'bc-cnt' }, `${count} ${count===1?'item':'itens'}`),
      ]),
      el('span', { class:'bc-arrow' }, '▸'),
    ]);
  }
}

function catCount(save, cat){
  if(cat==='key') return (save.bag.key||[]).length;
  return sumBag(save.bag[cat]);
}

function listByCategory(save, cat){
  if(cat==='balls'){
    return Object.entries(save.bag.balls).map(([id,qty])=>({
      id, item: ITEMS[id], qty,
    })).filter(r=>r.item);
  }
  if(cat==='medicine'){
    return Object.entries(save.bag.medicine).map(([id,qty])=>({
      id, item: ITEMS[id], qty,
    })).filter(r=>r.item);
  }
  if(cat==='key'){
    return save.bag.key.map(id => ({ id, item: ITEMS[id], qty: 1 })).filter(r=>r.item);
  }
  return Object.entries(save.bag[cat]||{}).map(([id,qty])=>({
    id, item: ITEMS[id], qty,
  })).filter(r=>r.item);
}
function sumBag(dict){ return Object.values(dict||{}).reduce((a,b)=>a+b,0); }
function catLabel(c){ return ({ balls:'Pokébolas', medicine:'Medicina', ev:'Vitaminas', held:'Itens p/ Segurar', mega:'Mega Pedras', zcrystal:'Cristais Z', tm:'TMs / HMs', evo:'Pedras Evolutivas', key:'Chave' })[c] || c; }

function itemRow(row, ctx, refresh){
  const { item, qty } = row;
  return el('div', { class:'bag-item' }, [
    el('div', { class:'bi-ic' }, [ itemSvg(item) ]),
    el('div', { class:'bi-info' }, [
      el('div', { class:'bi-name' }, item.name + (qty>1 ? ` × ${qty}` : '')),
      el('div', { class:'bi-desc' }, item.desc),
    ]),
    item.cat !== 'key'
      ? button({ label: useLabel(item), kind:'primary', onClick: ()=>useItem(item, ctx, refresh) })
      : el('span', { class:'bi-key' }, 'CHAVE'),
  ]);
}
function useLabel(item){
  if(item.cat==='ball') return 'USAR';
  if(item.cat==='held'||item.cat==='mega'||item.cat==='zcrystal') return 'EQUIPAR';
  if(item.cat==='evo') return 'USAR PEDRA';
  if(item.cat==='tm') return 'ENSINAR';
  return 'USAR';
}

async function useItem(item, ctx, refresh){
  const { save } = ctx;
  if(item.cat === 'ball'){
    ctx.toast('Pokébolas se usam num encontro selvagem.', 'info');
    return;
  }
  if(item.cat === 'med'){
    const target = await pickPartyTarget(save, item);
    if(!target) return;
    applyMedicine(item, target, save);
    audio.playSfx('heal');
    ctx.saveAndSync();
    refresh();
    ctx.toast(`${item.name} usado em ${target.nickname || target.name}!`, 'success');
    return;
  }
  if(item.cat === 'ev'){
    const target = await pickPartyTarget(save, item, 'ev');
    if(!target) return;
    await applyEvItem(item, target, save);
    ctx.saveAndSync(); refresh();
    ctx.toast(item.evReset ? 'EVs zerados.' : `+${item.evAmt} EV aplicado em ${target.nickname||target.name}.`, 'success');
    return;
  }
  if(item.cat === 'held' || item.cat === 'mega' || item.cat === 'zcrystal'){
    const target = await pickPartyTarget(save, item, 'equip');
    if(!target) return;
    equipHeld(item, target, save);
    audio.playSfx('success');
    ctx.saveAndSync(); refresh();
    ctx.toast(`${target.nickname || target.name} está segurando ${item.name}.`, 'success');
    return;
  }
  if(item.cat === 'tm'){
    const target = await pickPartyTarget(save, item, 'tm');
    if(!target) return;
    await teachTM(item, target, save, ctx);
    refresh();
    return;
  }
  if(item.cat === 'evo'){
    const target = await pickPartyTarget(save, item, 'evo');
    if(!target) return;
    await useStone(item, target, save, ctx);
    refresh();
    return;
  }
}

async function applyEvItem(item, mon, save){
  if(!mon.evs) return;
  const { recomputeStats } = await import('../mon-stats.js');
  if(item.evReset){
    for(const k of Object.keys(mon.evs)) mon.evs[k] = 0;
    consume(save, 'ev', item.id);
    recomputeStats(mon);
    audio.playSfx('heal');
    return;
  }
  const k = item.ev;
  const total = Object.values(mon.evs).reduce((a,b)=>a+b,0);
  if(mon.evs[k] >= 252){ audio.playSfx('error'); return; }
  if(total >= 510){ audio.playSfx('error'); return; }
  mon.evs[k] = Math.min(252, mon.evs[k] + (item.evAmt||10));
  consume(save, 'ev', item.id);
  recomputeStats(mon);
  audio.playSfx('heal');
}

function equipHeld(item, mon, save){
  const bagKey = item.cat === 'held' ? 'held' : item.cat;
  if(mon.held){
    const prev = ITEMS[mon.held];
    const prevKey = prev.cat === 'held' ? 'held' : prev.cat;
    save.bag[prevKey][mon.held] = (save.bag[prevKey][mon.held]||0) + 1;
  }
  consume(save, bagKey, item.id);
  mon.held = item.id;
}

async function teachTM(item, mon, save, ctx){
  const { fetchMove } = await import('../api.js');
  if((mon.moves||[]).some(m=>m.name===item.move)){ ctx.toast('Esse Pokémon já sabe esse golpe.', 'fail'); audio.playSfx('error'); return; }
  const mv = await fetchMove(item.move);
  if(!mv){ ctx.toast('Erro ao carregar o golpe.', 'fail'); return; }
  if(mon.moves.length < 4){
    mon.moves.push(mv);
  }else{
    const idx = await pickMoveSlot(mon, mv);
    if(idx == null) return;
    mon.moves[idx] = mv;
  }
  if(!item.hm) consume(save, 'tm', item.id);
  audio.playSfx('success');
  ctx.saveAndSync();
  ctx.toast(`${mon.nickname||mon.name} aprendeu ${item.move.replace(/-/g,' ').toUpperCase()}!`, 'success');
}
function pickMoveSlot(mon, newMove){
  return new Promise(resolve=>{
    const bd = el('div', { class:'modal-backdrop show' });
    const m = el('div', { class:'modal panel' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ ESQUECER QUAL GOLPE?'), el('button',{class:'panel-bar-close', onClick:()=>cl(null)}, '✕') ]),
      el('div', { class:'panel-body' }, [
        el('p', { class:'dialog-msg' }, `Para aprender <b>${newMove.name.replace(/-/g,' ').toUpperCase()}</b>, escolha um golpe para esquecer:`),
        el('div', { style:{display:'flex',flexDirection:'column',gap:'8px',marginTop:'10px'} }, mon.moves.map((mv,i)=> el('button', {
          class:'btn', style:{justifyContent:'flex-start'}, onClick: ()=>cl(i),
        }, [ el('span',{class:'btn-lbl'}, mv.name.replace(/-/g,' ').toUpperCase()) ]))),
      ]),
    ]);
    bd.appendChild(m); document.body.appendChild(bd);
    bd.addEventListener('click', e=>{ if(e.target===bd) cl(null); });
    function cl(v){ bd.remove(); resolve(v); }
  });
}
function consume(save, bagKey, id){
  if(!save.bag[bagKey]) return;
  save.bag[bagKey][id] = Math.max(0, (save.bag[bagKey][id]||0) - 1);
  if(save.bag[bagKey][id] === 0) delete save.bag[bagKey][id];
}

async function useStone(item, mon, save, ctx){
  const { canEvolveByStone, evolveMon, playEvolution } = await import('../evolution.js');
  const target = await canEvolveByStone(mon, item.stone);
  if(!target){
    ctx.toast(`${(mon.nickname||mon.name).toUpperCase()} não reage a ${item.name}.`, 'fail');
    audio.playSfx('error');
    return;
  }
  consume(save, 'evo', item.id);
  const fromSprite = mon.shiny ? (mon.sprite.shiny||mon.sprite.front) : mon.sprite.front;
  await playEvolution(mon, fromSprite, async ()=>{
    await evolveMon(mon, target);
    return mon.shiny ? (mon.sprite.shiny||mon.sprite.front) : mon.sprite.front;
  });
  save.pokedex.seen[mon.id] = save.pokedex.caught[mon.id] = { name: mon.name, types: mon.types, sprite: mon.sprite.front, at: Date.now(), region: save.trainer.region, shiny: mon.shiny };
  ctx.saveAndSync();
  ctx.toast(`${(mon.nickname||mon.name).toUpperCase()} evoluiu!`, 'success');
}

function applyMedicine(item, mon, save){
  if(item.heal != null){
    mon.hp = Math.min(mon.maxHp, mon.hp + item.heal);
  }
  if(item.revive){
    if(mon.hp <= 0){
      mon.hp = item.revive === 'full' ? mon.maxHp : Math.floor(mon.maxHp/2);
      mon.status = 'none';
    }
  }
  if(item.cure){
    if(item.cure === 'all') mon.status = 'none';
    else if(mon.status === item.cure) mon.status = 'none';
  }
  if(item.pp != null && mon.moves && mon.moves.length){
    const m = mon.moves.find(mv=>mv.pp < mv.maxPp) || mon.moves[0];
    m.pp = Math.min(m.maxPp, m.pp + item.pp);
  }
  if(item.ppAll != null && mon.moves){
    mon.moves.forEach(mv=>{ mv.pp = Math.min(mv.maxPp, mv.pp + item.ppAll); });
  }
  save.bag.medicine[item.id] = Math.max(0, (save.bag.medicine[item.id]||0) - 1);
  if(save.bag.medicine[item.id] === 0) delete save.bag.medicine[item.id];
}

function pickPartyTarget(save, item){
  return new Promise(resolve=>{
    const backdrop = el('div', { class:'modal-backdrop show' });
    const body = el('div', { class:'modal panel party-picker' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ USAR EM QUEM?'), el('button', { class:'panel-bar-close', onClick: ()=>close(null) }, '✕') ]),
      el('div', { class:'panel-body' }, [
        save.party.length === 0
          ? el('div', { class:'dim' }, 'Você não tem Pokémon na equipe.')
          : el('div', { class:'party-list' }, save.party.map(mon => el('button', {
              class:'pp-item'+(canUse(item, mon)?'':' disabled'),
              disabled: !canUse(item, mon),
              onClick: ()=>close(mon),
            }, [
              el('img', { src: mon.sprite.front, style:{ imageRendering:'pixelated' } }),
              el('div', {}, [
                el('div', { class:'pp-name' }, (mon.nickname || mon.name).toUpperCase()),
                el('div', { class:'pp-info mono' }, `Lv.${mon.level} · ${mon.hp}/${mon.maxHp} PS${mon.status!=='none'?' · '+mon.status:''}`),
              ]),
              el('div', { class:'pp-cta' }, canUse(item, mon)?'USAR ▸':'—'),
            ]))),
      ]),
    ]);
    backdrop.appendChild(body);
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(null); });
    function close(v){ backdrop.remove(); resolve(v); }
  });
}

function canUse(item, mon){
  if(item.heal != null) return mon.hp < mon.maxHp && mon.hp > 0;
  if(item.revive) return mon.hp <= 0;
  if(item.cat === 'evo') return true;
  if(item.cure) return mon.status === item.cure;
  return true;
}

/* ---- SVG icons ---- */
function itemSvg(item){
  if(item.cat==='ball'){
    return svgEl(`<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="${item.color}" stroke="#1B2154" stroke-width="2"/><path d="M2 16 H30" stroke="#1B2154" stroke-width="2"/><rect x="2" y="16" width="28" height="14" fill="#FFFCEC" stroke="#1B2154" stroke-width="0"/><circle cx="16" cy="16" r="4" fill="#FFFCEC" stroke="#1B2154" stroke-width="2"/><circle cx="16" cy="16" r="1.5" fill="#1B2154"/></svg>`);
  }
  if(item.cat==='med'){
    if(item.revive) return svgEl(`<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#FFB54D" stroke="#1B2154" stroke-width="2"/><path d="M11 16h10M16 11v10" stroke="#1B2154" stroke-width="3" stroke-linecap="round"/></svg>`);
    if(item.cure)   return svgEl(`<svg viewBox="0 0 32 32"><rect x="6" y="8" width="20" height="18" rx="3" fill="#79DAF7" stroke="#1B2154" stroke-width="2"/><path d="M11 17h10M16 12v10" stroke="#1B2154" stroke-width="3"/></svg>`);
    // potion
    const fill = { potion:'#FF8A8A','super-potion':'#79DAF7','hyper-potion':'#B080FF','max-potion':'#5EFFB1' }[item.id] || '#FF8A8A';
    return svgEl(`<svg viewBox="0 0 32 32"><rect x="11" y="3" width="10" height="5" fill="#1B2154"/><path d="M9 8h14l-1 18a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="${fill}" stroke="#1B2154" stroke-width="2"/></svg>`);
  }
  // key
  return svgEl(`<svg viewBox="0 0 32 32"><circle cx="11" cy="16" r="6" fill="#F2B939" stroke="#1B2154" stroke-width="2"/><path d="M17 16h12 M25 16v5 M21 16v3" stroke="#1B2154" stroke-width="3" stroke-linecap="round"/></svg>`);
}
function catSvg(lbl){
  if(lbl.includes('PEDRAS EVO')) return svgEl(`<svg viewBox="0 0 32 32"><polygon points="16,3 27,13 22,28 10,28 5,13" fill="#79DAF7" stroke="#1B2154" stroke-width="2" stroke-linejoin="round"/><polygon points="16,8 22,14 19,23 13,23 10,14" fill="#C6F0FF"/></svg>`);
  if(lbl.includes('MED'))  return svgEl(`<svg viewBox="0 0 32 32"><path d="M9 6h14l-1 20a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#FF8A8A" stroke="#1B2154" stroke-width="2"/></svg>`);
  return svgEl(`<svg viewBox="0 0 32 32"><circle cx="11" cy="16" r="6" fill="#F2B939" stroke="#1B2154" stroke-width="2"/><path d="M17 16h12 M25 16v5" stroke="#1B2154" stroke-width="3"/></svg>`);
}
function svgEl(s){ const d = document.createElement('div'); d.innerHTML = s; return d.firstChild; }
