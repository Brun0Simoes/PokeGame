/* ============================================================
   trainer-sprite.js — render a trainer sprite with fallback
   to a stylized SVG silhouette when Showdown 404s.
   ============================================================ */

import { el } from './ui.js';
import { trainerSprite } from './data.js';

/* Build a trainer sprite tile. Always returns an element of `size` px.
   Loads from Showdown; if image fails, switches to an SVG silhouette
   colored by `accent`.
*/
export function trainerSpriteTile({ key, name, size = 96, accent = '#DC3545' }){
  const wrap = el('div', { class:'tr-sprite', style:{ width:size+'px', height:size+'px' } });
  if(!key){
    wrap.appendChild(silhouette(name || '?', accent));
    return wrap;
  }
  const img = new Image();
  img.src = trainerSprite(key);
  img.alt = name || key;
  img.decoding = 'async';
  img.loading = 'eager';
  img.style.cssText = `width:100%;height:100%;object-fit:contain;image-rendering:pixelated;`;
  img.onerror = ()=>{
    wrap.innerHTML = '';
    wrap.appendChild(silhouette(name || '?', accent));
  };
  wrap.appendChild(img);
  return wrap;
}

/* Pixel-art silhouette fallback */
function silhouette(name, accent){
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  // hue from name so it's deterministic
  const hash = [...name].reduce((a,c)=>a+c.charCodeAt(0),0);
  const skin = ['#FCD9B5','#E8B883','#C99770','#9C6E4F','#6E4A30'][hash%5];
  const div = document.createElement('div');
  div.className = 'tr-silhouette';
  div.innerHTML = `<svg viewBox="0 0 32 32" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <!-- background -->
      <rect width="32" height="32" fill="${accent}22"/>
      <!-- hat shadow -->
      <rect x="9"  y="4" width="14" height="2" fill="#1B2154"/>
      <rect x="11" y="2" width="10" height="2" fill="#1B2154"/>
      <rect x="13" y="5" width="6"  height="1" fill="${accent}"/>
      <!-- head -->
      <rect x="11" y="6"  width="10" height="6" fill="${skin}"/>
      <rect x="13" y="8"  width="2"  height="1" fill="#1B2154"/>
      <rect x="17" y="8"  width="2"  height="1" fill="#1B2154"/>
      <rect x="15" y="10" width="2"  height="1" fill="#7A5230"/>
      <!-- neck -->
      <rect x="14" y="12" width="4"  height="2" fill="${skin}"/>
      <!-- body / shirt -->
      <rect x="9"  y="14" width="14" height="10" fill="${accent}"/>
      <rect x="11" y="16" width="10" height="2" fill="#FFF7"/>
      <!-- arms -->
      <rect x="7"  y="14" width="2"  height="8" fill="${accent}"/>
      <rect x="23" y="14" width="2"  height="8" fill="${accent}"/>
      <rect x="7"  y="20" width="2"  height="2" fill="${skin}"/>
      <rect x="23" y="20" width="2"  height="2" fill="${skin}"/>
      <!-- legs -->
      <rect x="11" y="24" width="4"  height="6" fill="#222"/>
      <rect x="17" y="24" width="4"  height="6" fill="#222"/>
      <!-- initial badge -->
      <rect x="22" y="22" width="8" height="8" fill="#FFF" stroke="#1B2154" stroke-width="1"/>
      <text x="26" y="28" font-family="Press Start 2P, monospace" font-size="6" text-anchor="middle" fill="${accent}">${initial}</text>
    </svg>`;
  return div;
}
