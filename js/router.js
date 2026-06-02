/* ============================================================
   router.js — hash-based routing
   #/  or #/login          -> auth.login
   #/register              -> auth.register
   #/onboard               -> auth.onboard (region + starter)
   #/game/<tab>            -> game tab
   ============================================================ */

const listeners = [];

export function onRoute(fn){ listeners.push(fn); fire(); }
export function go(path){
  if(path.startsWith('#')) path = path.slice(1);
  if(!path.startsWith('/')) path = '/'+path;
  if(location.hash === '#'+path) fire();
  else location.hash = '#'+path;
}
export function currentRoute(){
  const h = (location.hash || '#/').replace(/^#/,'');
  return h || '/';
}
function fire(){
  const route = currentRoute();
  listeners.forEach(fn => fn(route));
}
window.addEventListener('hashchange', fire);
