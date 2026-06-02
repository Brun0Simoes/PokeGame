/* ============================================================
   ar.js — AR / 3D encounter viewer overlay
   Reuses StageScene (Three.js + WebXR) from scenes.js.
   Opens fullscreen, loads the creature sprite as a billboard,
   starts WebXR immersive-ar when available, else a 3D fallback
   with on-screen status, place + capture actions.
   ============================================================ */

import * as THREE from 'three';
import { el, mount, toast } from './ui.js';
import { audio } from './audio.js';
import { api } from './api.js';
import { StageScene } from './scenes.js';

/* openAR({ pokemon, level, ctx, onCaptured }) */
export function openAR({ pokemon, level, ctx, onCaptured }){
  audio.unlock();
  const overlay = el('div', { class:'ar-overlay' });
  const canvas = el('canvas', { class:'ar-canvas' });
  const statusEl = el('div', { class:'ar-status mono' }, 'INICIANDO 3D…');
  const reticleHint = el('div', { class:'ar-reticle-hint mono' });

  const dock = el('div', { class:'ar-dock' }, [
    el('button', { class:'ar-btn', onClick: ()=>doAR() }, '◉ ENTRAR EM AR'),
    el('button', { class:'ar-btn', onClick: ()=>place() }, '⌖ POSICIONAR'),
    el('button', { class:'ar-btn capture', onClick: ()=>doCapture() }, '◓ CAPTURAR'),
    el('button', { class:'ar-btn close', onClick: ()=>close() }, '✕ SAIR'),
  ]);

  const header = el('div', { class:'ar-header' }, [
    el('div', { class:'ar-title mono' }, [
      el('span', {}, (pokemon.name||'?').toUpperCase()),
      el('span', { class:'ar-lvl' }, 'Lv.'+level),
    ]),
    statusEl,
  ]);

  overlay.appendChild(canvas);
  overlay.appendChild(header);
  overlay.appendChild(reticleHint);
  overlay.appendChild(dock);
  document.body.appendChild(overlay);

  let stage = null;
  let captured = false;

  // boot the scene
  requestAnimationFrame(async ()=>{
    stage = new StageScene(canvas);
    // load sprite texture and spawn
    const url = api.getBestSprite(pokemon, 'showdown', false) || api.getBestSprite(pokemon, 'front', false);
    const tex = await loadTex(url);
    if(tex) stage.setCreature(pokemon, tex, {});
    // check XR support
    if(navigator.xr && navigator.xr.isSessionSupported){
      const ok = await navigator.xr.isSessionSupported('immersive-ar').catch(()=>false);
      setStatus(ok ? 'WEBXR PRONTO · TOQUE EM “ENTRAR EM AR”' : 'AR INDISPONÍVEL · MODO 3D ATIVO');
      if(!ok) reticleHint.textContent = 'Arraste para girar · role para zoom';
    } else {
      setStatus('SEM WEBXR · MODO 3D ATIVO');
      reticleHint.textContent = 'Arraste para girar · role para zoom';
    }
    const cry = api.getCryUrl(pokemon);
    if(cry) setTimeout(()=>audio.playCry(cry), 400);
    audio.playSfx('spawn');
  });

  function setStatus(t){ statusEl.textContent = t; }

  async function doAR(){
    if(!stage) return;
    audio.playSfx('select');
    const ok = await stage.startAR(state=>{
      if(state==='unavailable'){ setStatus('AR NÃO SUPORTADO NESTE APARELHO'); toast('WebXR AR indisponível — use o modo 3D.', 'info'); }
      if(state==='searching'){ setStatus('PROCURANDO SUPERFÍCIE… MOVA O APARELHO'); reticleHint.textContent='Aponte para o chão e toque para posicionar'; }
      if(state==='ended'){ setStatus('SESSÃO AR ENCERRADA · MODO 3D'); }
      if(state==='error'){ setStatus('ERRO AO INICIAR AR'); }
    });
    if(!ok) setStatus('AR NÃO SUPORTADO · MODO 3D ATIVO');
  }

  function place(){
    if(!stage?.creature) return;
    audio.playSfx('jump');
    const ang = Math.random()*Math.PI*2, r = 0.4 + Math.random()*0.7;
    stage.creature.body.x = Math.cos(ang)*r;
    stage.creature.body.z = Math.sin(ang)*r;
    stage.creature.body.vy = 1.4;
  }

  async function doCapture(){
    if(captured){ return; }
    // delegate to a simple capture roll (reuses bag balls)
    const save = ctx.save;
    const balls = Object.entries(save.bag.balls||{}).filter(([id,q])=>q>0);
    if(!balls.length){ toast('Sem Pokébolas. Compre na Loja.', 'fail'); audio.playSfx('error'); return; }
    const ballId = balls[0][0];
    const { ITEMS } = await import('./data.js');
    const item = ITEMS[ballId];
    save.bag.balls[ballId]--; if(save.bag.balls[ballId]<=0) delete save.bag.balls[ballId];
    audio.playSfx('throw');
    if(stage?.creature) stage.creature.shake();
    setStatus('LANÇANDO ' + item.name.toUpperCase() + '…');
    await wait(1400);
    const chance = Math.max(0.2, Math.min(0.95, 0.55 * (item.mult||1)));
    if(Math.random() < chance){
      captured = true;
      audio.playSfx('capture');
      setStatus('GOTCHA! ' + pokemon.name.toUpperCase() + ' CAPTURADO!');
      const { makeMon } = await import('./api.js');
      const mon = await makeMon({ speciesIdOrName: pokemon.id, level, ball: ballId, source: save.trainer.region });
      if(mon){
        if(save.party.length < 6) save.party.push(mon); else save.box.push(mon);
        save.pokedex.caught[pokemon.id] = { name: pokemon.name, types: pokemon.types.map(t=>t.type.name), sprite: api.getBestSprite(pokemon,'showdown',false), at: Date.now(), region: save.trainer.region };
        ctx.saveAndSync();
      }
      onCaptured && onCaptured();
      setTimeout(close, 1400);
    } else {
      audio.playSfx('escape');
      setStatus('OH NÃO! ESCAPOU!');
      if(stage?.creature) stage.creature.flee();
    }
  }

  function close(){
    try{ stage && stage.dispose && stage.dispose(); }catch{}
    overlay.remove();
  }
}

function loadTex(url){
  return new Promise((resolve)=>{
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, t=>{ t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; resolve(t); }, undefined, ()=>resolve(null));
  });
}
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
