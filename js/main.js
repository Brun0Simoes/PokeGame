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

/* keep playtime advancing while logged in */
setInterval(()=>{
  const email = Store.currentEmail();
  if(!email) return;
  const save = Store.getSave(email);
  if(!save) return;
  save.trainer.hoursPlayed = (save.trainer.hoursPlayed||0) + 1/3600; // +1s
  save.trainer.lastPlayed = Date.now();
  Store.setSave(email, save);
}, 1000);
