/* ============================================================
   sw.js — service worker: offline app shell + runtime caches
   - Precaches the local app files (HTML/CSS/JS/icon)
   - Runtime-caches PokéAPI JSON (stale-while-revalidate)
   - Runtime-caches sprite/cry assets (cache-first)
   ============================================================ */

const VERSION = 'pkq-v5';
const SHELL = VERSION + '-shell';
const API   = VERSION + '-api';
const ASSET = VERSION + '-asset';

const SHELL_FILES = [
  './',
  'index.html',
  'css/main.css',
  'manifest.webmanifest',
  'icon.svg',
  'js/main.js', 'js/router.js', 'js/storage.js', 'js/data.js',
  'js/data/world.js', 'js/api.js', 'js/audio.js', 'js/ui.js', 'js/scenes.js',
  'js/auth.js', 'js/server-sync.js', 'js/game.js', 'js/tabs.js', 'js/trainer.js', 'js/trainer-sprite.js',
  'js/mon-stats.js', 'js/mon-detail.js', 'js/battle.js', 'js/battle-core.js',
  'js/evolution.js', 'js/breeding.js', 'js/quests.js', 'js/net.js', 'js/ar.js',
  'js/tabs/wild.js', 'js/tabs/profile.js', 'js/tabs/team.js', 'js/tabs/pc.js',
  'js/tabs/shop.js', 'js/tabs/trainers.js', 'js/tabs/gyms.js', 'js/tabs/elite.js',
  'js/tabs/bag.js', 'js/tabs/pokecenter.js', 'js/tabs/pokedex.js', 'js/tabs/travel.js',
  'js/tabs/quests.js', 'js/tabs/daycare.js', 'js/tabs/online.js', 'js/tabs/settings.js',
];

self.addEventListener('install', (e)=>{
  e.waitUntil((async ()=>{
    const c = await caches.open(SHELL);
    // best-effort: don't fail install if one file 404s
    await Promise.allSettled(SHELL_FILES.map(f=>c.add(f)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e)=>{
  e.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>!k.startsWith(VERSION)).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET') return;

  // PokéAPI JSON — stale-while-revalidate
  if(url.hostname === 'pokeapi.co'){
    e.respondWith(staleWhileRevalidate(e.request, API));
    return;
  }
  // sprites + cries + trainer art — cache-first
  if(/raw\.githubusercontent\.com|githubusercontent|play\.pokemonshowdown\.com|pokeapi\.co\/.*\.(png|ogg|mp3|svg)/.test(url.href)
     || /\.(png|jpg|jpeg|gif|webp|ogg|mp3)$/.test(url.pathname)){
    e.respondWith(cacheFirst(e.request, ASSET));
    return;
  }
  // same-origin app files — network-first so code updates always apply,
  // falling back to cache when offline
  if(url.origin === location.origin){
    e.respondWith(networkFirst(e.request, SHELL));
    return;
  }
});

async function networkFirst(req, cacheName){
  const cache = await caches.open(cacheName);
  try{
    const res = await fetch(req);
    if(res && res.status === 200) cache.put(req, res.clone());
    return res;
  }catch(err){
    const hit = await cache.match(req);
    return hit || Response.error();
  }
}

async function cacheFirst(req, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if(hit) return hit;
  try{
    const res = await fetch(req);
    if(res && res.status === 200) cache.put(req, res.clone());
    return res;
  }catch(err){
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req).then(res=>{
    if(res && res.status === 200) cache.put(req, res.clone());
    return res;
  }).catch(()=>hit);
  return hit || fetchPromise;
}
