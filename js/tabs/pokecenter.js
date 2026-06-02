/* ============================================================
   tabs/pokecenter.js — heal + PC box + Poké Mart
   ============================================================ */

import { el, mount, button, toast, confirmModal } from '../ui.js';
import { audio } from '../audio.js';
import { ITEMS } from '../data.js';

export function renderPokeCenter(root, ctx){
  audio.startMusic && audio.musicOn && audio.startMusic('center');
  const view = el('div', { class:'tab-page pkc-page' });
  mount(root, view);
  refresh();

  function refresh(){
    const { save } = ctx;
    const allFull = save.party.every(m => m.hp === m.maxHp && m.status === 'none');
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Centro Pokémon'),
        el('p', { class:'page-sub' }, 'Cure sua equipe, gerencie sua PC ou visite a Poké Mart.'),
      ]),
      el('div', { class:'pkc-layout' }, [
        // Heal counter
        panel('◢ BALCÃO DE CURA', [
          el('p', { class:'dialog-msg' }, allFull
            ? 'Sua equipe está em perfeitas condições. Bons treinos!'
            : 'A Enfermeira Joana pode curar todos os seus Pokémon de graça.'),
          el('div', { class:'pkc-party' }, save.party.map(mon =>
            el('div', { class:'pkc-mon'+(mon.hp<mon.maxHp||mon.status!=='none'?' hurt':'') }, [
              el('img', { src: mon.sprite.front, style:{ imageRendering:'pixelated' } }),
              el('div', {}, [
                el('div', { class:'pkc-name mono' }, (mon.nickname || mon.name).toUpperCase()),
                el('div', { class:'pkc-info mono' }, `Lv.${mon.level} · ${mon.hp}/${mon.maxHp} PS${mon.status!=='none'?' · '+mon.status:''}`),
                el('div', { class:'hp-bar '+(mon.hp/mon.maxHp<0.25?'low':mon.hp/mon.maxHp<0.5?'mid':'') }, [
                  el('div', { class:'fill', style:{ width: Math.max(0,mon.hp/mon.maxHp*100)+'%' } }),
                ]),
              ]),
            ])
          )),
          button({ label:'CURAR EQUIPE', kind:'primary', disabled: allFull, onClick: ()=>healAll(ctx, refresh) }),
        ]),
        // Mart
        panel('◢ POKÉ MART', [
          el('p', { class:'dialog-msg' }, `Saldo: <b>₽ ${ctx.save.trainer.money.toLocaleString('pt-BR')}</b>. Compre o que precisar para sua jornada.`),
          el('div', { class:'mart-grid' }, MART.map(line => martRow(line, ctx, refresh))),
        ]),
        // PC link
        panel('◢ PC DE BILL', [
          el('p', { class:'dialog-msg' }, `Você tem ${ctx.save.party.length}/6 na equipe e ${ctx.save.box.length} no PC.`),
          el('div', { class:'row gap' }, [
            button({ label:'ABRIR PC ▸', kind:'blue', onClick: ()=>ctx.go('/game/pc') }),
            button({ label:'MINHA EQUIPE ▸', kind:'ghost', onClick: ()=>ctx.go('/game/team') }),
          ]),
        ]),
      ]),
    );
  }
}

function healAll(ctx, refresh){
  ctx.save.party.forEach(m => { m.hp = m.maxHp; m.status = 'none'; m.moves.forEach(mv=>mv.pp = mv.maxPp); });
  audio.playSfx('heal');
  ctx.saveAndSync();
  toast('Equipe totalmente curada!', 'success');
  refresh();
}

const MART = [
  { id:'poke-ball',   stock:99 },
  { id:'great-ball',  stock:99 },
  { id:'ultra-ball',  stock:99 },
  { id:'potion',      stock:99 },
  { id:'super-potion',stock:99 },
  { id:'hyper-potion',stock:99 },
  { id:'max-potion',  stock:99 },
  { id:'revive',      stock:99 },
  { id:'max-revive',  stock:50 },
  { id:'antidote',    stock:99 },
  { id:'paralyz-heal',stock:99 },
  { id:'burn-heal',   stock:99 },
  { id:'awakening',   stock:99 },
  { id:'ice-heal',    stock:99 },
];

function martRow(line, ctx, refresh){
  const item = ITEMS[line.id];
  if(!item) return null;
  return el('div', { class:'mart-row' }, [
    el('div', { class:'mr-name' }, [
      el('div', { class:'mr-title' }, item.name),
      el('div', { class:'mr-desc' }, item.desc),
    ]),
    el('div', { class:'mr-price mono' }, '₽'+item.price.toLocaleString('pt-BR')),
    button({ label:'COMPRAR', kind:'primary', onClick: ()=>buy(item, ctx, refresh) }),
  ]);
}

function buy(item, ctx, refresh){
  const { save } = ctx;
  if(save.trainer.money < item.price){
    audio.playSfx('error');
    toast('Você não tem Pokédollars suficientes.', 'fail');
    return;
  }
  save.trainer.money -= item.price;
  if(item.cat === 'ball'){
    save.bag.balls[item.id] = (save.bag.balls[item.id]||0) + 1;
  }else if(item.cat === 'med'){
    save.bag.medicine[item.id] = (save.bag.medicine[item.id]||0) + 1;
  }else{
    if(!save.bag.key.includes(item.id)) save.bag.key.push(item.id);
  }
  audio.playSfx('success');
  toast(`+1 ${item.name}`, 'success');
  ctx.saveAndSync();
  refresh();
}

function box(label, list, onClick, cap){
  return el('div', { class:'pc-box' }, [
    el('div', { class:'pc-box-head mono' }, label + (cap?` · ${list.length}/${cap}`:` · ${list.length}`)),
    el('div', { class:'pc-box-grid' }, [
      ...list.map(mon => el('button', { class:'pc-slot', onClick: ()=>onClick(mon) }, [
        el('img', { src: mon.sprite.front, style:{ imageRendering:'pixelated' } }),
        el('div', { class:'pc-slot-name mono' }, (mon.nickname || mon.name).slice(0,10)),
      ])),
      ...(cap ? Array.from({length:Math.max(0, cap - list.length)}, ()=> el('div', { class:'pc-slot empty' })) : []),
    ]),
  ]);
}

function moveTo(dest, mon, ctx, refresh){
  const { save } = ctx;
  if(dest === 'box'){
    if(save.party.length <= 1){ toast('Você precisa ter ao menos 1 Pokémon na equipe.', 'fail'); audio.playSfx('error'); return; }
    save.party = save.party.filter(m => m.uid !== mon.uid);
    save.box.unshift(mon);
  }else{
    if(save.party.length >= 6){ toast('Equipe cheia (6).', 'fail'); audio.playSfx('error'); return; }
    save.box = save.box.filter(m => m.uid !== mon.uid);
    save.party.push(mon);
  }
  audio.playSfx('select');
  ctx.saveAndSync();
  refresh();
}

function panel(title, body){
  return el('div', { class:'panel page-panel' }, [
    el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span', {}, title) ]),
    el('div', { class:'panel-body' }, body),
  ]);
}
