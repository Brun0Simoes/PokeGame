/* ============================================================
   ui.js — DOM helpers + shared widgets (toast, type chip, sprite)
   ============================================================ */

import { TYPE_COLOR } from './data.js';

export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(v == null) continue;
    if(k === 'class') node.className = v;
    else if(k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if(k === 'html') node.innerHTML = v;
    else if(k === 'text') node.textContent = v;
    else if(k === 'dataset') Object.assign(node.dataset, v);
    else if(k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if(typeof v === 'boolean'){ if(v) node.setAttribute(k, ''); }
    else node.setAttribute(k, v);
  }
  for(const c of [].concat(children)){
    if(c == null || c === false) continue;
    if(c instanceof Node) node.appendChild(c);
    else node.appendChild(document.createTextNode(String(c)));
  }
  return node;
}

export function mount(parent, ...nodes){
  parent.innerHTML = '';
  for(const n of nodes){ if(n) parent.appendChild(n); }
}

export function typeChip(t, opts={}){
  return el('span', { class: 'type-chip t-'+t, style: opts.style }, t);
}

export function pokeball(size=18){
  return el('span', { class:'pokeball-icon', style:{ width:size+'px', height:size+'px' } });
}

export function hr(){ return el('div', { class:'hr' }); }

let toastTimer = null;
export function toast(msg, kind='info', dur=1800){
  let bar = $('#global-toast');
  if(!bar){
    bar = el('div', { id:'global-toast' });
    document.body.appendChild(bar);
  }
  bar.className = 'global-toast '+kind+' show';
  bar.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ bar.className = 'global-toast '+kind; }, dur);
}

/* a JRPG-style dialog box with optional title + arrow indicator */
export function dialogBox({ title, message, hint }){
  return el('div', { class:'dialog-box' }, [
    title && el('div', { class:'dialog-title' }, title),
    el('div', { class:'dialog-msg', html: message }),
    hint && el('div', { class:'dialog-hint' }, hint),
    el('div', { class:'dialog-arrow' }, '▼'),
  ]);
}

/* button helper */
export function button({ label, kind='', icon, onClick, disabled=false }){
  return el('button', {
    class: 'btn '+kind+(disabled?' disabled':''),
    disabled: disabled || undefined,
    onClick: onClick,
  }, [
    icon ? el('span', { class:'btn-ic' }, icon) : null,
    el('span', { class:'btn-lbl' }, label),
  ]);
}

/* a confirmation modal */
export function confirmModal({ title, message, confirmLabel='OK', cancelLabel='Cancelar' }){
  return new Promise(resolve=>{
    const backdrop = el('div', { class:'modal-backdrop' });
    const modal = el('div', { class:'modal panel' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span', {}, title) ]),
      el('div', { class:'modal-body' }, [
        el('p', { class:'dialog-msg', html: message }),
        el('div', { class:'modal-actions' }, [
          button({ label: cancelLabel, kind:'ghost', onClick: ()=>close(false) }),
          button({ label: confirmLabel, kind:'primary', onClick: ()=>close(true) }),
        ]),
      ]),
    ]);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    requestAnimationFrame(()=>backdrop.classList.add('show'));
    function close(val){
      backdrop.classList.remove('show');
      setTimeout(()=>backdrop.remove(), 200);
      resolve(val);
    }
  });
}

/* simple sprite tile (for pokédex, party, etc) */
export function spriteTile({ sprite, name, level, hp, maxHp, shiny=false, onClick, status='none', size=72, extras }){
  const wrap = el('div', { class:'sprite-tile'+(shiny?' shiny':'')+(onClick?' clickable':''), onClick }, [
    sprite ? el('img', { src: sprite, alt:name||'?', style:{ imageRendering:'pixelated', maxHeight:(size-12)+'px', maxWidth:(size-12)+'px' } })
           : el('div', { class:'sprite-placeholder' }, '?'),
    name && el('div', { class:'tile-name' }, name),
    (level!=null) && el('div', { class:'tile-lvl' }, 'Lv.'+level),
    (hp!=null && maxHp!=null) && el('div', { class:'tile-hp' }, [
      el('div', { class:'tile-hp-bar '+(hp/maxHp<0.25?'low': hp/maxHp<0.5?'mid':'ok') }, [
        el('div', { style:{ width: Math.max(0, hp/maxHp*100)+'%' } })
      ]),
      el('div', { class:'tile-hp-num' }, `${hp}/${maxHp}`)
    ]),
    status && status!=='none' ? el('div', { class:'tile-status s-'+status }, status.slice(0,3).toUpperCase()) : null,
    extras,
  ]);
  return wrap;
}

/* type aware multi-chip */
export function typeChips(types){
  return el('div', { class:'type-chips' }, (types||[]).map(t=>typeChip(t)));
}

/* hp bar widget (returns el + updateFn) */
export function hpBar({ hp, maxHp, label }){
  const bar = el('div', { class:'hp-bar' }, [ el('div', { class:'fill' }) ]);
  const num = el('span', { class:'hp-num' });
  function update(h, mh){
    hp = h; maxHp = mh;
    const pct = Math.max(0, Math.min(1, hp/maxHp));
    bar.querySelector('.fill').style.width = (pct*100)+'%';
    bar.classList.toggle('mid', pct<0.5 && pct>=0.25);
    bar.classList.toggle('low', pct<0.25);
    num.textContent = `${hp}/${maxHp}`;
  }
  update(hp, maxHp);
  return { root: el('div', { class:'hp-bar-wrap' }, [ label?el('span',{class:'hp-lbl'}, label):null, bar, num ]), update };
}

/* very small templating helper used by some screens */
export function html(strings, ...vals){
  let out = '';
  strings.forEach((s,i)=>{ out += s; if(i<vals.length) out += (vals[i] == null ? '' : String(vals[i])); });
  return out;
}
