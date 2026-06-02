/* ============================================================
   audio.js — procedural music + SFX + Pokémon cry playback
   ============================================================ */

class AudioManager{
  constructor(){
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicOn = false;
    this.sfxOn = true;
    this.musicVol = 0.13;
    this.sfxVol = 0.5;
    this.musicNodes = [];
    this.cryEl = null;
    this._mood = 'route';
  }
  unlock(){
    if(this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    this.ctx = new Ctx();
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0; this.musicGain.connect(this.ctx.destination);
    this.sfxGain   = this.ctx.createGain(); this.sfxGain.gain.value   = this.sfxVol; this.sfxGain.connect(this.ctx.destination);
  }
  _osc(freq, dur, type='sine', gainStart=0.3, attack=0.005, out=null){
    if(!this.sfxOn || !this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(gainStart, ctx.currentTime + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(out || this.sfxGain);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }
  playSfx(name){
    if(!this.ctx || !this.sfxOn) return;
    switch(name){
      case 'click':   this._osc(700, 0.05, 'square', 0.18); break;
      case 'select':  this._osc(520, 0.05, 'square', 0.2); setTimeout(()=>this._osc(780,0.06,'square',0.18), 60); break;
      case 'open':    [400,520,640,800].forEach((f,i)=>setTimeout(()=>this._osc(f,0.06,'square',0.2), i*40)); break;
      case 'cancel':  this._osc(440, 0.06, 'sawtooth', 0.2); setTimeout(()=>this._osc(330,0.07,'sawtooth',0.18), 60); break;
      case 'success': [523, 659, 784, 1047].forEach((f,i)=>setTimeout(()=>this._osc(f,0.1,'square',0.22), i*70)); break;
      case 'error':   this._osc(180, 0.18, 'sawtooth', 0.3); break;
      case 'scan':    [400,520,640,760].forEach((f,i)=>setTimeout(()=>this._osc(f,0.08,'square',0.18), i*70)); break;
      case 'spawn':   [659,784,988,1318].forEach((f,i)=>setTimeout(()=>this._osc(f,0.1,'square',0.22), i*55)); break;
      case 'jump':    this._osc(540, 0.08, 'square', 0.2); setTimeout(()=>this._osc(780,0.06,'square',0.18), 70); break;
      case 'throw':   this._osc(300, 0.12, 'square', 0.22); setTimeout(()=>this._osc(180,0.1,'square',0.18), 80); break;
      case 'shake':   this._osc(180, 0.05, 'square', 0.2); setTimeout(()=>this._osc(220,0.05,'square',0.16),60); break;
      case 'capture': [262,330,392,523,659,784].forEach((f,i)=>setTimeout(()=>this._osc(f,0.12,'square',0.22), i*90)); break;
      case 'escape':  [523,392,330,262,196].forEach((f,i)=>setTimeout(()=>this._osc(f,0.12,'sawtooth',0.22), i*100)); break;
      case 'heal':    [523,659,784].forEach((f,i)=>setTimeout(()=>this._osc(f,0.18,'sine',0.22),i*120)); break;
      case 'badge':   [523, 659, 784, 1047, 1319].forEach((f,i)=>setTimeout(()=>this._osc(f,0.12,'square',0.24), i*100)); break;
      default: this._osc(440, 0.07, 'square', 0.18);
    }
  }
  playCry(url){
    if(!this.sfxOn || !url) return;
    try{
      if(this.cryEl){ this.cryEl.pause(); }
      this.cryEl = new Audio(url);
      this.cryEl.volume = 0.45;
      this.cryEl.crossOrigin = 'anonymous';
      this.cryEl.play().catch(()=>{});
    }catch{}
  }

  /* Procedural music modes:
       route  — calm chiptune adventure
       battle — uptempo
       gym    — heroic
       center — calm twinkle
  */
  setRegion(regionId){
    const T = { kanto:1, johto:1.06, hoenn:0.94, sinnoh:1.12, unova:0.89,
                kalos:1.19, alola:1.03, galar:0.84, hisui:0.79, paldea:1.26 };
    this._regionTranspose = T[regionId] || 1;
    if(this.musicOn) this.startMusic(this._mood);
  }
  startMusic(mood='route'){
    this.unlock();
    if(!this.ctx) return;
    const TR = this._regionTranspose || 1;
    if(this.musicOn && this._mood===mood) return;
    if(this.musicOn) this.stopMusic(true);
    this.musicOn = true;
    this._mood = mood;
    const ctx = this.ctx;
    this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(this.musicVol, ctx.currentTime + 0.8);

    const params = {
      route:  { tempo:180, bass:[82.4,82.4,110.0,98.0,73.4,73.4,87.3,65.4], arp:[261.6,329.6,392.0,523.2,392.0,329.6,392.0,523.2], padF1:130.8, padF2:196.0, lp:900 },
      battle: { tempo:130, bass:[110.0,110.0,146.8,164.8,98.0,98.0,123.5,164.8], arp:[330,392,494,659,494,392,330,392], padF1:110, padF2:165, lp:1400 },
      gym:    { tempo:170, bass:[98.0,98.0,123.5,146.8,73.4,73.4,82.4,110.0], arp:[392,494,587,784,587,494,392,587], padF1:147, padF2:196, lp:1100 },
      center: { tempo:300, bass:[174.6,196.0,220.0,196.0], arp:[523,659,784,988,1175,988,784,659], padF1:174, padF2:261, lp:1500 },
    }[mood] || {};

    const pad = ctx.createOscillator();  pad.type='triangle';  pad.frequency.value = params.padF1*TR;
    const pad2 = ctx.createOscillator(); pad2.type='triangle'; pad2.frequency.value = params.padF2*TR;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = params.lp;
    const padG = ctx.createGain(); padG.gain.value = 0.12;
    pad.connect(lp); pad2.connect(lp); lp.connect(padG); padG.connect(this.musicGain);
    pad.start(); pad2.start();
    this.musicNodes.push(pad, pad2, lp, padG);

    let bIdx = 0;
    this._bassInt = setInterval(()=>{
      if(!this.musicOn) return;
      const o = ctx.createOscillator(); o.type='square';
      o.frequency.value = params.bass[bIdx%params.bass.length]*TR;
      const g = ctx.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      o.connect(g); g.connect(this.musicGain);
      o.start(); o.stop(ctx.currentTime + 0.2);
      bIdx++;
    }, params.tempo*2);

    let aIdx=0;
    this._arpInt = setInterval(()=>{
      if(!this.musicOn) return;
      const o = ctx.createOscillator(); o.type='square';
      o.frequency.value = params.arp[aIdx%params.arp.length]*TR * (Math.random()>0.85? 2 : 1);
      const g = ctx.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.connect(g); g.connect(this.musicGain);
      o.start(); o.stop(ctx.currentTime + 0.28);
      aIdx++;
    }, params.tempo);
  }
  stopMusic(silentTransition=false){
    if(!this.musicOn) return;
    this.musicOn = false;
    clearInterval(this._arpInt); clearInterval(this._bassInt);
    if(!this.ctx) return;
    const t = silentTransition ? 0.05 : 0.6;
    this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.musicGain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + t);
    setTimeout(()=>{
      this.musicNodes.forEach(n=>{ try{ n.stop && n.stop(); n.disconnect && n.disconnect(); }catch{} });
      this.musicNodes = [];
    }, t*1000 + 100);
  }
  setSfxOn(on){ this.sfxOn = !!on; }
  setMusicOn(on){
    if(on) this.startMusic(this._mood);
    else  this.stopMusic();
  }
  setVolume(v){
    this.musicVol = Math.max(0, Math.min(0.5, v*0.5));
    this.sfxVol   = Math.max(0, Math.min(1.0, v));
    if(this.sfxGain) this.sfxGain.gain.value = this.sfxVol;
    if(this.musicGain && this.musicOn) this.musicGain.gain.value = this.musicVol;
  }
  toggleMusic(){
    this.unlock();
    if(this.musicOn) this.stopMusic(); else this.startMusic(this._mood);
    return this.musicOn;
  }
}

export const audio = new AudioManager();
window.__audio = audio;
