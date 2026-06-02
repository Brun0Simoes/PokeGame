/* ============================================================
   tabs/pc.js — Bill's PC: multi-box storage + party panel
   Click a stored mon → action menu (withdraw / inspect / release).
   Click a party mon → action menu (deposit / inspect).
   ============================================================ */

import { el, mount, button, toast, confirmModal } from '../ui.js';
import { audio } from '../audio.js';
import { TYPE_COLOR } from '../data.js';
import { openMonDetail } from '../mon-detail.js';

const BOX_SIZE = 30; // slots per box
const BOX_NAMES = ['CAIXA 1','CAIXA 2','CAIXA 3','CAIXA 4','CAIXA 5','CAIXA 6','CAIXA 7','CAIXA 8'];

export function renderPC(root, ctx){
  const { save } = ctx;
  let boxIdx = 0;

  // Ensure box array exists
  if(!Array.isArray(save.box)) save.box = [];

  const view = el('div', { class:'tab-page pc-page-v2' });
  mount(root, view);
  refresh();

  function boxCount(){ return Math.max(1, Math.ceil((save.box.length + 1) / BOX_SIZE)); }
  function boxSlice(i){ return save.box.slice(i*BOX_SIZE, (i+1)*BOX_SIZE); }

  function refresh(){
    const totalBoxes = boxCount();
    if(boxIdx >= totalBoxes) boxIdx = totalBoxes - 1;
    const slice = boxSlice(boxIdx);

    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, "PC de Bill"),
        el('p', { class:'page-sub' },
          `Armazenamento: ${save.box.length} Pokémon · Equipe: ${save.party.length}/6. ` +
          'Clique num Pokémon para depositar, retirar, inspecionar ou liberar.'),
      ]),

      el('div', { class:'pc-v2-layout' }, [
        // ===== Storage system =====
        el('div', { class:'pc-system panel flush' }, [
          el('div', { class:'pc-sys-bar' }, [
            el('button', { class:'pc-nav', disabled: totalBoxes<=1, onClick: ()=>{ boxIdx=(boxIdx-1+totalBoxes)%totalBoxes; audio.playSfx('click'); refresh(); } }, '◂'),
            el('div', { class:'pc-box-title mono' }, [
              el('span', {}, BOX_NAMES[boxIdx] || ('CAIXA '+(boxIdx+1))),
              el('span', { class:'pc-box-sub' }, `${slice.length}/${BOX_SIZE}`),
            ]),
            el('button', { class:'pc-nav', disabled: totalBoxes<=1, onClick: ()=>{ boxIdx=(boxIdx+1)%totalBoxes; audio.playSfx('click'); refresh(); } }, '▸'),
          ]),
          el('div', { class:'pc-box-grid-v2' }, [
            ...slice.map(mon => storedSlot(mon)),
            ...Array.from({length: Math.max(0, BOX_SIZE - slice.length)}, ()=> el('div', { class:'pc-slot-v2 empty' })),
          ]),
          el('div', { class:'pc-box-dots' }, Array.from({length:totalBoxes}, (_,i)=>
            el('button', { class:'pc-dot'+(i===boxIdx?' on':''), onClick: ()=>{ boxIdx=i; refresh(); } }))),
        ]),

        // ===== Party panel =====
        el('div', { class:'pc-party-panel panel flush' }, [
          el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ EQUIPE') ]),
          el('div', { class:'pc-party-list' }, [
            ...save.party.map(mon => partyRow(mon)),
            ...Array.from({length: Math.max(0, 6 - save.party.length)}, ()=> el('div', { class:'pc-party-empty' }, [ el('div',{class:'pokeball faint'}), el('span',{class:'mono dim small'}, 'vazio') ])),
          ]),
          el('p', { class:'dim small', style:{padding:'0 14px 14px'} },
            'A equipe vai com você nas batalhas. Mantenha ao menos 1 Pokémon nela.'),
        ]),
      ]),
    );
  }

  function storedSlot(mon){
    const sprite = mon.shiny ? (mon.sprite.shiny || mon.sprite.front) : mon.sprite.front;
    return el('button', {
      class:'pc-slot-v2'+(mon.shiny?' shiny':''),
      title: (mon.nickname||mon.name)+' · Lv.'+mon.level,
      onClick: ()=>openActions(mon, 'box'),
    }, [
      el('img', { src: sprite, alt: mon.name, style:{ imageRendering:'pixelated' } }),
      el('span', { class:'pc-slot-lv mono' }, mon.level),
    ]);
  }

  function partyRow(mon){
    const types = mon.types || [];
    const accent = TYPE_COLOR[types[0]] || '#888';
    const sprite = mon.shiny ? (mon.sprite.shiny || mon.sprite.front) : mon.sprite.front;
    return el('button', {
      class:'pc-party-row'+(mon.hp<=0?' fainted':''),
      onClick: ()=>openActions(mon, 'party'),
    }, [
      el('div', { class:'ppr-art', style:{ background:`radial-gradient(ellipse at 50% 80%, ${accent}44, transparent 70%)` } }, [
        el('img', { src: sprite, style:{ imageRendering:'pixelated' } }),
      ]),
      el('div', { class:'ppr-info' }, [
        el('div', { class:'ppr-name mono' }, (mon.nickname||mon.name).toUpperCase()),
        el('div', { class:'ppr-lvl mono dim' }, 'Lv.'+mon.level),
        el('div', { class:'hp-bar '+(mon.hp/mon.maxHp<0.25?'low':mon.hp/mon.maxHp<0.5?'mid':'') }, [
          el('div', { class:'fill', style:{ width: Math.max(0,mon.hp/mon.maxHp*100)+'%' } }),
        ]),
      ]),
    ]);
  }

  /* action menu popover */
  function openActions(mon, where){
    audio.playSfx('select');
    const bd = el('div', { class:'modal-backdrop show' });
    const sprite = mon.shiny ? (mon.sprite.shiny||mon.sprite.front) : mon.sprite.front;
    const m = el('div', { class:'modal panel pc-actions' }, [
      el('div', { class:'panel-bar' }, [
        el('span',{class:'dot'}),
        el('span',{}, '◢ ' + (mon.nickname||mon.name).toUpperCase()),
        el('button',{class:'panel-bar-close', onClick:()=>cl()}, '✕'),
      ]),
      el('div', { class:'panel-body' }, [
        el('div', { class:'pca-head' }, [
          el('img', { src: sprite, style:{ imageRendering:'pixelated', width:'72px', height:'72px', objectFit:'contain' } }),
          el('div', {}, [
            el('div', { class:'mono', style:{fontSize:'11px'} }, (mon.nickname||mon.name).toUpperCase()),
            el('div', { class:'mono dim small' }, 'Lv.'+mon.level+' · #'+String(mon.id).padStart(3,'0')),
            el('div', { class:'mono dim small' }, where==='box'?'No PC':'Na equipe'),
          ]),
        ]),
        el('div', { class:'pca-actions' }, [
          where === 'box'
            ? button({ label:'RETIRAR P/ EQUIPE', kind:'primary', onClick: ()=>{ withdraw(mon); cl(); } })
            : button({ label:'DEPOSITAR NO PC', kind:'blue', onClick: ()=>{ deposit(mon); cl(); } }),
          button({ label:'VER / EDITAR', kind:'ghost', onClick: ()=>{ cl(); openMonDetail(mon, ctx, { onClose: refresh }); } }),
          button({ label:'LIBERAR', kind:'ghost', onClick: ()=>{ release(mon, where, cl); } }),
        ]),
      ]),
    ]);
    bd.appendChild(m); document.body.appendChild(bd);
    bd.addEventListener('click', e=>{ if(e.target===bd) cl(); });
    function cl(){ bd.remove(); }
  }

  function withdraw(mon){
    if(save.party.length >= 6){ toast('Equipe cheia (6).', 'fail'); audio.playSfx('error'); return; }
    save.box = save.box.filter(m=>m.uid!==mon.uid);
    save.party.push(mon);
    audio.playSfx('success');
    toast(`${(mon.nickname||mon.name).toUpperCase()} entrou na equipe.`, 'success');
    ctx.saveAndSync(); refresh();
  }
  function deposit(mon){
    if(save.party.length <= 1){ toast('A equipe precisa de ao menos 1 Pokémon.', 'fail'); audio.playSfx('error'); return; }
    save.party = save.party.filter(m=>m.uid!==mon.uid);
    save.box.unshift(mon);
    audio.playSfx('cancel');
    toast(`${(mon.nickname||mon.name).toUpperCase()} foi guardado.`, 'info');
    ctx.saveAndSync(); refresh();
  }
  async function release(mon, where, closeMenu){
    const ok = await confirmModal({
      title:'LIBERAR POKÉMON',
      message:`Tem certeza que quer liberar <b>${(mon.nickname||mon.name).toUpperCase()}</b>? Esta ação é permanente.`,
      confirmLabel:'LIBERAR', cancelLabel:'CANCELAR',
    });
    if(!ok) return;
    if(where==='party'){
      if(save.party.length <= 1){ toast('A equipe precisa de ao menos 1 Pokémon.', 'fail'); return; }
      save.party = save.party.filter(m=>m.uid!==mon.uid);
    }else{
      save.box = save.box.filter(m=>m.uid!==mon.uid);
    }
    audio.playSfx('cancel');
    toast(`${(mon.nickname||mon.name).toUpperCase()} foi liberado. Adeus!`, 'info');
    ctx.saveAndSync();
    closeMenu();
    refresh();
  }
}
