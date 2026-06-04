/* ============================================================
   tabs/daycare.js — Day-Care UI: deposit 2 mons, lay/hatch eggs
   ============================================================ */

import { el, mount, button, toast } from '../ui.js';
import { audio } from '../audio.js';
import { ensureDaycare, compatible, layEgg, hatchEgg } from '../breeding.js';

export function renderDaycare(root, ctx){
  const { save } = ctx;
  ensureDaycare(save);
  const view = el('div', { class:'tab-page daycare-page' });
  mount(root, view);
  refresh();

  function refresh(){
    const dc = save.daycare;
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Day-Care & Criação'),
        el('p', { class:'page-sub' }, 'Deixe dois Pokémon compatíveis e eles podem gerar um Ovo. O Ovo choca conforme você vence batalhas, herdando IVs e natureza dos pais.'),
      ]),

      el('div', { class:'dc-slots' }, [
        slotCard(0), slotCard(1),
      ]),

      el('div', { class:'panel page-panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ OVO') ]),
        el('div', { class:'panel-body' }, [ eggView() ]),
      ]),
    );
  }

  function slotCard(i){
    const dc = save.daycare;
    const mon = dc.slots[i];
    return el('div', { class:'dc-slot panel' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ VAGA '+(i+1)) ]),
      el('div', { class:'panel-body' }, mon ? [
        el('div', { class:'dc-mon' }, [
          el('img', { src: mon.shiny?(mon.sprite.shiny||mon.sprite.front):mon.sprite.front, style:{ imageRendering:'pixelated' } }),
          el('div', {}, [
            el('div', { class:'dc-mon-name mono' }, (mon.nickname||mon.name).toUpperCase()),
            el('div', { class:'dc-mon-meta mono dim' }, 'Lv.'+mon.level+' · '+(mon.types||[]).join('/')),
          ]),
        ]),
        button({ label:'RETIRAR', kind:'ghost', onClick:()=>withdraw(i) }),
      ] : [
        el('div', { class:'dc-empty' }, [
          el('div', { class:'dc-empty-ic' }, '🥚'),
          el('p', { class:'dim' }, 'Vaga vazia. Deposite um Pokémon da equipe.'),
        ]),
        button({ label:'DEPOSITAR ▸', kind:'blue', onClick:()=>openPicker(i) }),
      ]),
    ]);
  }

  function eggView(){
    const dc = save.daycare;
    const [a,b] = dc.slots;
    if(dc.egg){
      const pct = Math.min(100, dc.egg.stepsDone/dc.egg.stepsNeeded*100);
      const ready = dc.egg.stepsDone >= dc.egg.stepsNeeded;
      return el('div', { class:'dc-egg' }, [
        el('div', { class:'dc-egg-icon'+(ready?' ready':'') }, '🥚'),
        el('div', { class:'dc-egg-info' }, [
          el('div', { class:'mono', style:{fontSize:'11px',color:'var(--border)'} }, ready ? 'O OVO ESTÁ CHOCANDO!' : 'UM OVO ESTÁ SENDO CHOCADO'),
          el('div', { class:'q-bar', style:{margin:'8px 0'} }, [ el('div', { class:'q-fill', style:{ width:pct+'%' } }) ]),
          el('div', { class:'mono dim', style:{fontSize:'9px'} }, ready ? 'Pronto para chocar!' : `Vença mais ${dc.egg.stepsNeeded - dc.egg.stepsDone} batalha(s) para chocar.`),
          ready
            ? button({ label:'CHOCAR OVO ▸', kind:'primary', onClick:()=>doHatch() })
            : el('div', { class:'mono dim', style:{fontSize:'9px',marginTop:'6px'} }, '✦ IVs e natureza herdados dos pais'),
        ]),
      ]);
    }
    return el('div', { class:'dc-egg-empty' }, [
      el('p', { class:'dialog-msg', html: a && b
        ? 'Os dois Pokémon estão na creche. Tente gerar um Ovo!'
        : 'Deposite <b>dois</b> Pokémon compatíveis (mesmo tipo ou mesma família) para gerar um Ovo.' }),
      button({ label:'GERAR OVO', kind:'primary', disabled:!(a&&b), onClick:()=>doLay() }),
    ]);
  }

  async function doLay(){
    const [a,b] = save.daycare.slots;
    const ok = await compatible(a,b);
    if(!ok){ toast('Esses dois não são compatíveis. Tente mesmo tipo ou família.', 'fail'); audio.playSfx('error'); return; }
    const egg = await layEgg(save);
    if(egg){ audio.playSfx('success'); toast('Um Ovo apareceu na creche!', 'success'); ctx.saveAndSync(); refresh(); }
  }
  async function doHatch(){
    const mon = await hatchEgg(save);
    if(mon){
      audio.playSfx('capture');
      toast(`O Ovo chocou! Nasceu ${mon.name.toUpperCase()}!`, 'success');
      ctx.saveAndSync(); refresh();
    }
  }
  function withdraw(i){
    const mon = save.daycare.slots[i];
    if(!mon) return;
    if(save.party.length >= 6){ toast('Equipe cheia — abra espaço primeiro.', 'fail'); return; }
    save.party.push(mon);
    save.daycare.slots[i] = null;
    audio.playSfx('select'); ctx.saveAndSync(); refresh();
  }
  function openPicker(i){
    const avail = save.party;
    if(avail.length <= 1){ toast('Você precisa de Pokémon de sobra na equipe.', 'fail'); return; }
    const bd = el('div', { class:'modal-backdrop show' });
    const m = el('div', { class:'modal panel' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ DEPOSITAR QUAL?'), el('button',{class:'panel-bar-close', onClick:()=>bd.remove()}, '✕') ]),
      el('div', { class:'panel-body' }, [
        el('div', { class:'dc-pick' }, avail.map(mon => el('button', {
          class:'dc-pick-item', onClick:()=>{ deposit(i, mon); bd.remove(); },
        }, [
          el('img', { src: mon.sprite.front, style:{imageRendering:'pixelated'} }),
          el('div', {}, [
            el('div', { class:'mono', style:{fontSize:'10px'} }, (mon.nickname||mon.name).toUpperCase()),
            el('div', { class:'mono dim', style:{fontSize:'8px'} }, 'Lv.'+mon.level),
          ]),
        ]))),
      ]),
    ]);
    bd.appendChild(m); document.body.appendChild(bd);
    bd.addEventListener('click', e=>{ if(e.target===bd) bd.remove(); });
  }
  function deposit(i, mon){
    if(save.party.length <= 1){ toast('Precisa manter ao menos 1 na equipe.', 'fail'); return; }
    save.party = save.party.filter(x=>x.uid!==mon.uid);
    save.daycare.slots[i] = mon;
    audio.playSfx('select'); ctx.saveAndSync(); refresh();
  }
}
