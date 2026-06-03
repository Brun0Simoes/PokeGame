/* ============================================================
   main.js — SPA entry point. Reads route, mounts auth or game.
   ============================================================ */

import { onRoute, currentRoute, go } from './router.js';
import { Store } from './storage.js';
import { renderAuth, resetAuth } from './auth.js';
import { renderGame, clearShell } from './game.js';
import { audio } from './audio.js';
import { $, el } from './ui.js';

const appRoot = document.getElementById('app');
window.__pkqBooted = true;

onRoute(async (route)=>{
  const logged = !!Store.currentEmail();

  // Default route depending on auth state
  if(route === '/' || route === ''){
    if(logged) return go('/game/wild');
    return go('/login');
  }

  if(route.startsWith('/game')){
    if(!logged){ resetAuth(); return go('/login'); }
    renderGame(appRoot, route);
    return;
  }

  // /login | /register | (anything else)
  if(logged){
    return go('/game/wild');
  }
  clearShell();
  renderAuth(appRoot);
});

/* unlock audio on first user gesture so it can resume later
   (browsers block autoplay without one) */
window.addEventListener('pointerdown', ()=> audio.unlock(), { once:true });
window.addEventListener('keydown',     ()=> audio.unlock(), { once:true });

/* register the service worker for offline play + asset caching */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').catch(err=>console.warn('SW falhou:', err));
  });
}

/* ---- FIX B: playtime tracker com batch + flush periodico ----
   Antes: setSave a cada 1s = 3600 writes/h em localStorage e
   spam de debounced server-sync. Agora: acumula em memoria e
   persiste a cada 30s. Tambem flush no beforeunload pra nao
   perder progresso de playtime. */
let _pendingPlayTime = 0; // segundos acumulados
function flushPlaytime(){
  if(_pendingPlayTime === 0) return;
  const email = Store.currentEmail();
  if(!email) return;
  const save = Store.getSave(email);
  if(!save) return;
  save.trainer.hoursPlayed = (save.trainer.hoursPlayed||0) + _pendingPlayTime / 3600;
  save.trainer.lastPlayed = Date.now();
  Store.setSave(email, save);
  _pendingPlayTime = 0;
}
setInterval(()=>{
  if(Store.currentEmail()) _pendingPlayTime++;
}, 1000);
setInterval(flushPlaytime, 30000);     // 30s — 120 writes/h em vez de 3600
window.addEventListener('beforeunload', flushPlaytime);
window.addEventListener('pagehide',     flushPlaytime);
