/* ============================================================
   battle.js — turn-based battle (wild + trainer)
   exports:
     startWildBattle({ ctx, wildPokemon, level })   -> 'caught'|'ko'|'flee_player'|'flee_wild'
     runQuickBattle({ ctx, opponentLabel, opponentTeam, sprite, musicMood })
                                                    -> 'win'|'lose'|'flee'
   ============================================================ */

import { el, button, toast } from './ui.js';
import { audio } from './audio.js';
import { api, makeMon } from './api.js';
import { typeMultiplier, TYPE_COLOR, ITEMS } from './data.js';
import { trainerSpriteTile } from './trainer-sprite.js';
import * as core from './battle-core.js';

const TYPE_LABEL = {
  normal:'NORMAL', fire:'FOGO', water:'ÁGUA', electric:'ELÉTRICO', grass:'GRAMA',
  ice:'GELO', fighting:'LUTA', poison:'VENENO', ground:'TERRA', flying:'VOADOR',
  psychic:'PSÍQUICO', bug:'INSETO', rock:'ROCHA', ghost:'FANTASMA', dragon:'DRAGÃO',
  dark:'NOTURNO', steel:'AÇO', fairy:'FADA',
};

/* =========== Wild battle =========== */
export async function startWildBattle({ ctx, wildPokemon, level }){
  // Build enemy mon (full)
  const enemy = await makeMon({
    speciesIdOrName: wildPokemon.id || wildPokemon.name,
    level,
    shiny: Math.random() < 1/4096,
    source: 'wild',
  });
  if(!enemy){ toast('Erro ao carregar o Pokémon.', 'fail'); return 'flee_wild'; }

  // Need a usable party
  const playerTeam = ctx.save.party.filter(m => m.hp > 0);
  if(playerTeam.length === 0){
    toast('Sua equipe está nocauteada. Vá ao Centro Pokémon.', 'fail');
    audio.playSfx('error');
    return 'flee_wild';
  }

  return new BattleEngine({
    ctx,
    playerTeam: ctx.save.party,
    enemyTeam: [enemy],
    isWild: true,
    enemyLabel: 'Pokémon selvagem',
    enemySprite: null,
    musicMood: 'battle',
  }).run();
}

/* =========== Trainer battle =========== */
export async function runQuickBattle({ ctx, opponentLabel, opponentTeam, sprite, musicMood='battle', seed=null }){
  // Resolve enemy team
  const enemyTeam = [];
  for(const t of opponentTeam){
    const m = await makeMon({ speciesIdOrName: t.id, level: t.lvl, source: opponentLabel });
    if(m) enemyTeam.push(m);
  }
  if(enemyTeam.length === 0){ toast('Equipe inimiga vazia.', 'fail'); return 'lose'; }

  const playerTeam = ctx.save.party.filter(m => m.hp > 0);
  if(playerTeam.length === 0){
    toast('Sua equipe está nocauteada.', 'fail');
    return 'lose';
  }

  return new BattleEngine({
    ctx,
    playerTeam: ctx.save.party,
    enemyTeam,
    isWild: false,
    enemyLabel: opponentLabel,
    enemySprite: sprite,
    musicMood,
    seed, // PHASE 3: passa seed para RNG deterministico
  }).run();
}

/* =========== Engine =========== */
class BattleEngine{
  constructor(opts){
    this.opts = opts;
    this.playerTeam = opts.playerTeam;
    this.enemyTeam = opts.enemyTeam;
    this.pIdx = this._firstAliveIdx(this.playerTeam);
    this.eIdx = 0;
    this.log = [];
    this.mode = 'main'; // main | fight | bag | switch | message | over
    this.lock = false;
    this.lastResult = null;
    // PHASE 3: PvP-deterministic RNG. Se opts.seed for fornecido (via online.js),
    // o RNG vira deterministic; senao usa Math.random normal.
    this._rng = opts.seed != null ? core.createSeededRng(opts.seed) : Math.random;
  }

  _firstAliveIdx(team){ return team.findIndex(m=>m.hp>0); }
  get pMon(){ return this.playerTeam[this.pIdx]; }
  get eMon(){ return this.enemyTeam[this.eIdx]; }

  /* ---- PHASE 1: bioma do background baseado em regiao + clima ---- */
  _biomeFor(){
    const region = this.opts.ctx?.save?.trainer?.region || 'kanto';
    // mapping super simples; cada um aplica gradiente + cor de chao diferente em CSS
    return region; // CSS handles via .biome-kanto, .biome-johto, etc
  }

  /* prep a mon for battle: stages, held data, mega backup slot */
  _prep(mon){
    if(!mon._battlePrepped){
      mon._stages = core.freshStages();
      mon._heldData = mon.held ? (ITEMS[mon.held]?.held || null) : null;
      mon._sashUsed = false;
      mon._gemUsed = false;
      mon._powerHerbUsed = false;
      mon._metroStacks = 0;
      mon._lastMove = null;
      mon._battlePrepped = true;
      mon._sleepTurns = undefined;
      // PHASE 1: Eviolite — checa se ainda evolui (async, defaults false)
      mon._canStillEvolve = false;
      if(mon._heldData?.effect === 'eviolite'){
        import('./evolution.js').then(ev =>
          ev.nextEvolution(mon).then(n => { mon._canStillEvolve = !!n; })
        ).catch(()=>{});
      }
    }
  }

  run(){
    audio.unlock();
    audio.startMusic && audio.musicOn && audio.startMusic(this.opts.musicMood || 'battle');
    this.weather = 'none';
    this.weatherTurns = 0;
    this.terrain = 'none';
    this.terrainTurns = 0;
    this.pSide = core.freshSide();
    this.eSide = core.freshSide();
    this.playerTeam.forEach(m=>this._prep(m));
    this.enemyTeam.forEach(m=>this._prep(m));
    this.backdrop = el('div', { class:'modal-backdrop battle-backdrop show' });
    this.root = el('div', { class:'battle-modal' });
    this.backdrop.appendChild(this.root);
    document.body.appendChild(this.backdrop);

    this._intro();
    this._render();

    return new Promise(resolve => {
      this._resolve = resolve;
    });
  }
  _intro(){
    if(this.opts.isWild){
      this.log.push(`Um <b>${this.eMon.name.toUpperCase()}</b> selvagem apareceu!`);
    } else {
      this.log.push(`<b>${this.opts.enemyLabel}</b> quer batalhar!`);
      this.log.push(`<b>${this.opts.enemyLabel}</b> mandou <b>${this.eMon.name.toUpperCase()}</b>!`);
    }
    this.log.push(`Vai, <b>${this.pMon.nickname || this.pMon.name.toUpperCase()}</b>!`);
    // lead switch-in abilities (intimidate / weather)
    this._queueSwitchIn(this.pMon, this.eMon);
    this._queueSwitchIn(this.eMon, this.pMon);
  }
  _queueSwitchIn(mon, foe){
    const evs = core.abilitySwitchIn(mon, foe);
    for(const e of evs){
      this.log.push(e.message);
      if(e.weather){ this.weather = e.weather; this.weatherTurns = 5; }
    }
    // ---- PHASE 1: Heavy-Duty Boots — ignora hazards ----
    if(mon._heldData?.effect==='boots'){
      this.log.push(`${(mon.nickname||mon.name).toUpperCase()} ignorou os perigos com as Botas Resistentes.`);
      return;
    }
    // entry hazards on the side the mon enters
    const side = (mon === this.pMon) ? this.pSide : this.eSide;
    const hz = core.hazardOnEntry(side, mon);
    for(const h of hz){
      if(h.dmg){ mon.hp = Math.max(0, mon.hp - h.dmg); }
      if(h.status){ const r = core.applyStatus(mon, h.status); if(!r.ok) continue; }
      this.log.push(h.message);
    }
  }
  /* ---- FIX A: X button no canto. Em wild = fuga; em trainer = aplica multa ---- */
  _abortBattle(){
    // ja estamos numa tela de "over"? so fecha
    if(this.mode === 'over'){ this._close(this.lastResult); return; }
    if(this.opts.isWild){
      // wild: trata como fuga sem rolar formula (atalho de X)
      this._close('flee_player');
      return;
    }
    // trainer: confirma + aplica derrota com multa
    const ok = confirm('Desistir da batalha? Voce vai perder dinheiro como em uma derrota.');
    if(!ok) return;
    this._finishDefeat();
    // _finishDefeat ja seta lastResult='lose'; agora fecha
    setTimeout(()=>this._close(this.lastResult || 'lose'), 100);
  }

  async _close(verdict){
    // ---- Restaura mons que sofreram Mega/Dynamax (post-batalha) ----
    // Iteramos AMBOS os times pra cobrir switch mid-gimmick.
    // Para mons com base/ivs/evs/nature: recomputeStats e a fonte de verdade
    // (cobre o caso de mega+level-up na mesma batalha — backup teria stats velhos).
    // Senao, fallback para o backup direto.
    const { recomputeStats } = await import('./mon-stats.js');
    for (const mon of [...this.playerTeam, ...this.enemyTeam]) {
      if (!mon) continue;
      const wasMega = !!mon._megaBackup;
      const wasDyna = !!mon._maxBackup;

      if (wasMega) {
        mon.types = mon._megaBackup.types;  // tipos voltam
        delete mon._megaBackup;
        mon._mega = false;
      }
      if (wasDyna) {
        // restaura HP/maxHp proporcionalmente
        const ratio = mon.maxHp > 0 ? mon.hp / mon.maxHp : 1;
        mon.maxHp = mon._maxBackup.maxHp;
        mon.hp = Math.max(0, Math.min(mon.maxHp, Math.round(mon.maxHp * ratio)));
        delete mon._maxBackup;
        mon._dyna = false;
        mon._gmax = false;
      }
      // Re-deriva stats do mon (cobre level-ups ocorridos durante mega/dyna)
      if ((wasMega || wasDyna) && mon.base && mon.ivs && mon.evs) {
        const hpRatio = mon.maxHp > 0 ? mon.hp / mon.maxHp : 1;
        recomputeStats(mon);
        // se Dyna ja tinha ajustado HP, preserva a proporcao final
        if (!wasDyna) {
          mon.hp = Math.max(0, Math.min(mon.maxHp, Math.round(mon.maxHp * hpRatio)));
        }
      }
      // Limpa flags transitorios de batalha
      delete mon._stages;
      delete mon._heldData;
      delete mon._sashUsed;
      delete mon._sitrusUsed;
      delete mon._battlePrepped;
      delete mon._charging;
      delete mon._confused;
      delete mon._flinched;
      delete mon._sleepTurns;
      delete mon._maxGuard;
    }

    // play any queued level-up evolutions before leaving the battle
    if(this._evoQueue && this._evoQueue.length){
      const { canEvolveByLevel, canEvolveByHeldItem, evolveMon, playEvolution } = await import('./evolution.js');
      for(const mon of this._evoQueue){
        if(mon.hp <= 0) continue;
        const target = await canEvolveByLevel(mon) || await canEvolveByHeldItem(mon, mon.held);
        if(!target) continue;
        const fromSprite = mon.shiny ? (mon.sprite.shiny||mon.sprite.front) : mon.sprite.front;
        await playEvolution(mon, fromSprite, async ()=>{
          await evolveMon(mon, target);
          return mon.shiny ? (mon.sprite.shiny||mon.sprite.front) : mon.sprite.front;
        });
        const q = await import('./quests.js'); q.questEvent(this.opts.ctx.save, 'evolve');
        // mark pokédex for the evolved form
        const save = this.opts.ctx.save;
        save.pokedex.seen[mon.id] = save.pokedex.caught[mon.id] = { name: mon.name, types: mon.types, sprite: mon.sprite.front, at: Date.now(), region: save.trainer.region, shiny: mon.shiny };
      }
      this._evoQueue = [];
      this.opts.ctx.saveAndSync();
    }
    audio.startMusic && audio.musicOn && audio.startMusic('route');
    this.backdrop.classList.remove('show');
    setTimeout(()=>this.backdrop.remove(), 200);
    this._resolve(verdict);
  }

  _render(){
    this.root.innerHTML = '';
    const screen = el('div', { class:'battle-screen panel flush' }, [
      el('div', { class:'panel-bar' }, [
        el('span', { class:'dot' }),
        el('span', {}, this.opts.isWild ? '◢ POKÉMON SELVAGEM' : '◢ ' + this.opts.enemyLabel.toUpperCase()),
        el('button', { class:'panel-bar-close', onClick: ()=>this._abortBattle() }, '✕'),
      ]),
      this._scene(),
      this._dialog(),
      this._menu(),
    ]);
    this.root.appendChild(screen);
  }

  _scene(){
    const eMon = this.eMon;
    const pMon = this.pMon;
    const isWild = this.opts.isWild;
    const w = this.weather || 'none';
    // PHASE 1: biome do background derivado da regiao do save (kanto, johto, etc)
    const biome = this._biomeFor();
    return el('div', { class:'bs-scene weather-'+w+' biome-'+biome+
        (this._screenShake?' shaking':'')+(this._critFlash?' crit-flash':'') }, [
      el('div', { class:'bs-bg-sky' }),
      el('div', { class:'bs-bg-sun' }),
      el('div', { class:'bs-bg-clouds' }),
      el('div', { class:'bs-bg-hills' }),
      el('div', { class:'bs-bg-ground' }),
      el('div', { class:'bs-bg-grass-fg' }),
      // weather overlay (tint + particles)
      w!=='none' && el('div', { class:'bs-weather' }, [
        el('div', { class:'bs-weather-tint' }),
        el('div', { class:'bs-weather-particles' }),
        el('div', { class:'bs-weather-badge mono' }, core.WEATHER[w].toUpperCase()),
      ]),

      // Enemy side
      el('div', { class:'bs-hud bs-hud-enemy' }, hudBox(eMon, true, isWild)),
      el('div', { class:'bs-mon bs-mon-enemy' }, [
        el('img', {
          // PHASE 1: classes para mega/dyna/gmax/ko
          class:'bs-spr enemy '+
            (this._enemyHurt?'hurt ':'')+
            (this._enemyCapturing?'capturing ':'')+
            (eMon._mega?'mega-form ':'')+
            (eMon._dyna?'dyna-form ':'')+
            (eMon._gmax?'gmax-form ':'')+
            (eMon.hp<=0?'koed ':''),
          src: eMon.shiny ? (eMon.sprite.shiny || eMon.sprite.front) : eMon.sprite.front,
          alt: eMon.name,
          style:{ imageRendering:'pixelated' },
        }),
        el('div', { class:'bs-platform bs-platform-e' }),
      ]),

      // Player side
      el('div', { class:'bs-mon bs-mon-player' }, [
        el('img', {
          class:'bs-spr player '+
            (this._playerHurt?'hurt ':'')+
            (pMon._mega?'mega-form ':'')+
            (pMon._dyna?'dyna-form ':'')+
            (pMon._gmax?'gmax-form ':'')+
            (pMon.hp<=0?'koed ':''),
          src: pMon.sprite.back || pMon.sprite.front,
          alt: pMon.name,
          style:{ imageRendering:'pixelated' },
        }),
        el('div', { class:'bs-platform bs-platform-p' }),
      ]),
      el('div', { class:'bs-hud bs-hud-player' }, hudBox(pMon, false, false)),

      // Trainer portrait — only for trainer battles, before first attack
      !isWild && this.opts.enemySprite && el('div', { class:'bs-trainer-portrait' },
        trainerSpriteTile({ key: this.opts.enemySprite, name: this.opts.enemyLabel, size: 64 })
      ),

      // Capture flash overlay
      this._captureFlash && el('div', { class:'bs-capture-flash' }),
      // Poké Ball capture animation
      this._ballPhase && this._ballOverlay(),
      // Gimmick activation FX (mega / dynamax / gigantamax / z-move)
      this._gimmickFx && this._gimmickFxOverlay(),
    ]);
  }

  _gimmickFxOverlay(){
    const fx = this._gimmickFx;
    const side = fx.side || 'player';
    if(fx.kind === 'mega'){
      return el('div', { class:'bs-fx mega-fx '+side }, [
        el('div', { class:'mega-ring r1' }),
        el('div', { class:'mega-ring r2' }),
        el('div', { class:'mega-ring r3' }),
        el('div', { class:'mega-burst' }),
        el('div', { class:'mega-symbol' }, '⎛'),
        ...Array.from({length:8}, (_,i)=>el('div', { class:'mega-shard s'+i })),
      ]);
    }
    if(fx.kind === 'dynamax' || fx.kind === 'gmax'){
      return el('div', { class:'bs-fx dynamax-fx '+(fx.kind==='gmax'?'gmax':'')+' '+side }, [
        el('div', { class:'dyna-clouds' }),
        el('div', { class:'dyna-core' }),
        ...Array.from({length:10}, (_,i)=>el('div', { class:'dyna-bolt b'+i })),
        el('div', { class:'dyna-ring' }),
        fx.kind==='gmax' && el('div', { class:'gmax-label mono' }, 'GIGANTAMAX'),
      ]);
    }
    if(fx.kind === 'z'){
      return el('div', { class:'bs-fx z-fx', style:'--fx-color:'+(fx.color||'#F2B939')+';' }, [
        el('div', { class:'z-flood' }),
        el('div', { class:'z-ring' }),
        el('div', { class:'z-glyph mono' }, 'Z'),
        ...Array.from({length:12}, (_,i)=>el('div', { class:'z-beam bm'+i })),
      ]);
    }
    return null;
  }

  async _playGimmickFx(kind, color){
    this._gimmickFx = { kind, color, side:'player' };
    this._render();
    audio.playSfx('badge');
    await wait(kind==='z' ? 1100 : 1300);
    this._gimmickFx = null;
    this._render();
  }

  _ballOverlay(){
    const c = this._ballColor || '#DC3545';
    return el('div', { class:'bs-ball-layer phase-'+this._ballPhase }, [
      el('div', { class:'bs-ball-3d', style:'--ball-color:'+c+';' }, [
        el('div', { class:'bs-ball-shine' }),
        el('div', { class:'bs-ball-button' }),
      ]),
      this._ballPhase==='caught' && el('div', { class:'bs-ball-stars' }, ['✧','✨','✧'].map(s=>el('span',{},s))),
      (this._ballPhase==='break') && el('div', { class:'bs-ball-burst' }, Array.from({length:6},()=>el('span',{}))),
    ]);
  }

  _dialog(){
    const last = this.log.slice(-2);
    return el('div', { class:'bs-log dialog-box' }, [
      ...last.map((line,i) => el('div', { class:'bs-log-line'+(i===last.length-1?' current':''), html: line })),
      el('div', { class:'dialog-arrow' }, '▼'),
    ]);
  }

  _menu(){
    if(this.lock){
      return el('div', { class:'bs-menu' }, [
        el('div', { class:'bs-menu-info' }, '· · ·'),
      ]);
    }
    switch(this.mode){
      case 'fight':   return this._fightMenu();
      case 'bag':     return this._bagMenu();
      case 'switch':  return this._switchMenu();
      case 'over':    return el('div', { class:'bs-menu' }, [
        el('button', { class:'btn primary', onClick: ()=>this._close(this.lastResult) }, [
          el('span',{class:'btn-lbl'}, 'CONTINUAR ▸')
        ]),
      ]);
      default:        return this._mainMenu();
    }
  }
  _mainMenu(){
    return el('div', { class:'bs-menu bs-menu-main' }, [
      mb('LUTAR',   '⚔',   ()=>{ this.mode='fight';  this._render(); audio.playSfx('select'); }),
      mb('MOCHILA', '🎒', ()=>{ this.mode='bag';    this._render(); audio.playSfx('select'); }),
      mb('POKÉMON', '◉',  ()=>{ this.mode='switch'; this._render(); audio.playSfx('select'); }),
      mb(this.opts.isWild ? 'FUGIR' : 'DESISTIR', '⤴', ()=>this._tryRun()),
    ]);
  }
  _fightMenu(){
    const moves = this.pMon.moves || [];
    const gim = this._gimmickBar();
    return el('div', { class:'bs-menu bs-menu-fight-wrap' }, [
      gim,
      this._enemyTypeHint(),
      el('div', { class:'bs-menu-fight' }, [
        ...moves.map(m => {
          const eff = (m.power>0 || this._zActive || this._maxActive) ? typeMultiplier(m.type, this.eMon.types) : 1;
          const isDmg = m.power>0 || this._zActive || this._maxActive;
          return el('button', {
            class:'bs-move-btn t-'+m.type+(this._zActive?' z-armed':'')+(this._maxActive?' max-armed':'')+(isDmg?' eff-'+effClass(eff):''),
            disabled: m.pp <= 0 && !this._zActive && !this._maxActive,
            onClick: ()=>this._playerMove(m),
          }, [
            isDmg && el('span', { class:'mv-eff-bar eff-'+effClass(eff), title: effLabel(eff) }),
            el('div', { class:'mv-name mono' }, this._displayMoveName(m)),
            el('div', { class:'mv-meta mono' }, [
              el('span', {}, TYPE_LABEL[m.type] || m.type.toUpperCase()),
              el('span', {}, (this._effectivePower(m) || '—') + ' POW'),
              el('span', {}, (this._zActive||this._maxActive) ? '∞' : (m.pp + '/' + m.maxPp + 'PP')),
            ]),
            isDmg && eff!==1 && el('span', { class:'mv-eff-tag eff-'+effClass(eff) }, effShort(eff)),
          ]);
        }),
        ...(moves.length < 4 ? Array.from({length: 4 - moves.length}, ()=>
          el('button', { class:'bs-move-btn empty', disabled:true }, '—')
        ) : []),
        el('button', { class:'bs-back', onClick: ()=>{ this.mode='main'; this._render(); audio.playSfx('cancel'); } }, '◂ VOLTAR'),
      ]),
    ]);
  }

  /* recommended-typing hint vs current enemy */
  _enemyTypeHint(){
    const enemyTypes = this.eMon.types || [];
    // find types that are super effective against the enemy
    const strong = [];
    for(const atk of CORE_TYPES){
      const m = typeMultiplier(atk, enemyTypes);
      if(m >= 2) strong.push(atk);
    }
    const eName = (this.eMon.nickname||this.eMon.name).toUpperCase();
    return el('div', { class:'bs-type-hint' }, [
      el('div', { class:'bth-row' }, [
        el('span', { class:'bth-lbl mono' }, eName+' É:'),
        el('div', { class:'bth-types' }, enemyTypes.map(t=>el('span',{class:'type-chip t-'+t}, TYPE_LABEL[t]||t))),
      ]),
      el('div', { class:'bth-row' }, [
        el('span', { class:'bth-lbl mono', style:{color:'var(--green-deep)'} }, 'FRACO A:'),
        el('div', { class:'bth-types' }, strong.length
          ? strong.map(t=>el('span',{class:'type-chip t-'+t, title:'2× ou mais'}, TYPE_LABEL[t]||t))
          : [el('span',{class:'mono dim small'}, 'nada em especial')]),
      ]),
    ]);
  }

  /* gimmick activation bar (Mega / Dynamax / Z) — only player side, once per battle */
  _gimmickBar(){
    const btns = [];
    const av = this._gimmickAvail();
    if(av.mega){
      btns.push(el('button', {
        class:'gim-btn mega'+(this._megaArmed?' armed':''),
        onClick: ()=>{ this._megaArmed=!this._megaArmed; this._zArmed=false; this._maxArmed=false; audio.playSfx('select'); this._render(); },
      }, [ el('span',{class:'gim-ic'},'✦'), el('span',{class:'gim-l mono'}, this._megaArmed?'MEGA ✓':'MEGA') ]));
    }
    if(av.z){
      btns.push(el('button', {
        class:'gim-btn zmove'+(this._zArmed?' armed':''),
        onClick: ()=>{ this._zArmed=!this._zArmed; this._megaArmed=false; this._maxArmed=false; audio.playSfx('select'); this._render(); },
      }, [ el('span',{class:'gim-ic'},'Z'), el('span',{class:'gim-l mono'}, this._zArmed?'MOV. Z ✓':'MOV. Z') ]));
    }
    if(av.max){
      const isG = !!this._gmaxFor(this.pMon);
      btns.push(el('button', {
        class:'gim-btn dynamax'+(this._maxArmed?' armed':''),
        onClick: ()=>{ this._maxArmed=!this._maxArmed; this._megaArmed=false; this._zArmed=false; audio.playSfx('select'); this._render(); },
      }, [ el('span',{class:'gim-ic'},'◉'), el('span',{class:'gim-l mono'}, this._maxArmed?(isG?'G-MAX ✓':'DYNA ✓'):(isG?'GIGANTAMAX':'DYNAMAX')) ]));
    }
    if(btns.length === 0) return null;
    return el('div', { class:'bs-gimmick-bar' }, [
      el('span', { class:'gim-hint mono' }, 'PODER:'),
      ...btns,
    ]);
  }

  /* which gimmicks are available to the active mon (player only, once/battle) */
  _gimmickAvail(){
    const save = this.opts.ctx.save;
    const key = save.bag.key || [];
    const mon = this.pMon;
    const held = mon.held ? ITEMS[mon.held] : null;
    return {
      mega: !this._gimmickUsed && key.includes('mega-ring') && held && held.cat==='mega' && held.megaFor === mon.id,
      z:    !this._gimmickUsed && key.includes('z-ring') && held && held.cat==='zcrystal',
      max:  !this._gimmickUsed && key.includes('dynamax-band'),
    };
  }
  _gmaxFor(mon){
    // a few iconic Gigantamax species
    const GMAX = { 6:1, 9:1, 3:1, 12:1, 25:1, 68:1, 94:1, 131:1, 143:1, 569:1, 809:1, 823:1, 844:1, 884:1 };
    return GMAX[mon.id] ? true : false;
  }
  _displayMoveName(m){
    if(this._maxActive){
      const isG = this._gmaxFor(this.pMon);
      return (isG ? 'G-MAX ' : 'MAX ') + (m.damage_class==='status' ? 'GUARDA' : (TYPE_LABEL[m.type]||m.type).toUpperCase());
    }
    if(this._zActive){
      return 'Z-' + m.name.replace(/-/g,' ').toUpperCase();
    }
    return m.name.replace(/-/g,' ').toUpperCase();
  }
  _effectivePower(m){
    let p = m.power || 0;
    if(this._maxActive && p>0) p = Math.min(150, Math.round(p*1.5));
    if(this._zActive && p>0)   p = zPower(p);
    return p || (m.power||0);
  }
  _bagMenu(){
    const save = this.opts.ctx.save;
    const balls = Object.entries(save.bag.balls || {}).filter(([id,q])=>q>0);
    const meds  = Object.entries(save.bag.medicine || {}).filter(([id,q])=>q>0);

    return el('div', { class:'bs-menu bs-menu-bag' }, [
      el('div', { class:'bs-bag-section' }, [
        el('div', { class:'bs-bag-lbl mono' }, 'POKÉBOLAS'),
        balls.length === 0
          ? el('div', { class:'dim mono small' }, 'Sem Pokébolas')
          : el('div', { class:'bs-bag-grid' }, balls.map(([id,q]) => bagItem(ITEMS[id], q, ()=>this._useBall(id)))),
      ]),
      el('div', { class:'bs-bag-section' }, [
        el('div', { class:'bs-bag-lbl mono' }, 'MEDICINA'),
        meds.length === 0
          ? el('div', { class:'dim mono small' }, 'Sem itens médicos')
          : el('div', { class:'bs-bag-grid' }, meds.map(([id,q]) => bagItem(ITEMS[id], q, ()=>this._useMed(id)))),
      ]),
      el('button', { class:'bs-back', onClick: ()=>{ this.mode='main'; this._render(); audio.playSfx('cancel'); } }, '◂ VOLTAR'),
    ]);
  }
  _switchMenu(){
    return el('div', { class:'bs-menu bs-menu-switch' }, [
      ...this.playerTeam.map((mon,i) => el('button', {
        class:'bs-switch-item'+(i===this.pIdx?' active':''),
        disabled: i===this.pIdx || mon.hp<=0,
        onClick: ()=>this._switchTo(i),
      }, [
        el('img', { src: mon.sprite.front, style:{imageRendering:'pixelated'} }),
        el('div', {}, [
          el('div', { class:'mono' }, (mon.nickname || mon.name).toUpperCase()),
          el('div', { class:'mono small dim' },
            'Lv.'+mon.level+' · '+mon.hp+'/'+mon.maxHp+
            (i===this.pIdx?' · ATIVO':'')+
            (mon.hp<=0?' · K.O.':'')),
        ]),
      ])),
      el('button', { class:'bs-back', onClick: ()=>{ this.mode='main'; this._render(); audio.playSfx('cancel'); } }, '◂ VOLTAR'),
    ]);
  }

  /* ===== Action handlers ===== */
  /* ===== Gimmick effects ===== */
  async _doMega(){
    const mon = this.pMon;
    const held = ITEMS[mon.held];
    const data = core.MEGA_DATA[mon.id];
    let megaName = held.megaName || ('Mega '+mon.name.toUpperCase());
    let newTypes = null;
    let delta = null;
    if(data){
      // X/Y forms (Charizard, Mewtwo) escolhidas pelo nome do held item
      if(data.x && /\bX$/.test(held.megaName||'')) {
        megaName=data.x.name; newTypes=data.x.types; delta=data.x.delta;
      } else if(data.y && /\bY$/.test(held.megaName||'')) {
        megaName=data.y.name; newTypes=data.y.types; delta=data.y.delta;
      } else if(data.types){
        megaName=data.name; newTypes=data.types; delta=data.delta;
      }
    }
    this.log.push(`◈ ${(mon.nickname||mon.name).toUpperCase()} Mega Evoluiu para <b>${megaName}</b>!`);
    mon._megaBackup = { stats: { ...mon.stats }, types: [...mon.types] };
    // ---- PHASE 2: aplica delta canonical por espécie. Fallback +20% flat. ----
    if(delta){
      for(const k of ['attack','defense','special-attack','special-defense','speed']){
        mon.stats[k] = Math.max(1, mon.stats[k] + (delta[k] || 0));
      }
    } else {
      // espécie fora do MEGA_DATA — fallback antigo
      for(const k of ['attack','defense','special-attack','special-defense','speed']){
        mon.stats[k] = Math.round(mon.stats[k] * 1.2);
      }
    }
    if(newTypes) mon.types = newTypes;
    mon._mega = true;
    await this._playGimmickFx('mega');
    this._render(); await wait(500);
  }
  async _doDynamax(){
    const mon = this.pMon;
    const isG = this._gmaxFor(mon);
    this.log.push(`◉ ${(mon.nickname||mon.name).toUpperCase()} ${isG?'Gigantamax':'Dynamax'}! O tamanho e os PS dispararam!`);
    mon._maxBackup = { hp: mon.hp, maxHp: mon.maxHp };
    mon.maxHp = Math.round(mon.maxHp * 2);
    mon.hp = Math.round(mon.hp * 2);
    mon._dyna = true; mon._gmax = isG;
    await this._playGimmickFx(isG ? 'gmax' : 'dynamax');
    this.log.push(`◉ ${(mon.nickname||mon.name).toUpperCase()} ${isG?'Gigantamax':'Dynamax'}! O tamanho e os PS dispararam!`);
    this._render(); await wait(500);
  }
  _endMaxIfNeeded(){
    // dynamax lasts 3 turns
    if(this._maxActive){
      this._maxTurns--;
      if(this._maxTurns <= 0){
        this._maxActive = false;
        const mon = this.pMon;
        if(mon._maxBackup){
          const ratio = mon.hp/mon.maxHp;
          mon.maxHp = mon._maxBackup.maxHp;
          mon.hp = Math.max(1, Math.min(mon.maxHp, Math.round(mon.maxHp*ratio)));
          mon._dyna = false; delete mon._maxBackup;
        }
        this.log.push(`O efeito Dynamax passou.`);
      }
    }
  }

  async _playerMove(move){
    // Resolve armed gimmicks first
    if(this._megaArmed){
      this._megaArmed = false;
      this._gimmickUsed = true;
      await this._doMega();
    } else if(this._maxArmed){
      this._maxArmed = false;
      this._gimmickUsed = true;
      await this._doDynamax();
      this._maxActive = true; this._maxTurns = 3;
    } else if(this._zArmed){
      this._zArmed = false;
      this._gimmickUsed = true;
      this._zActive = true; // one-shot, consumed below
      const { TYPE_COLOR } = await import('./data.js');
      await this._playGimmickFx('z', TYPE_COLOR[move.type] || '#F2B939');
    }
    if(move.pp <= 0 && !this._zActive && !this._maxActive){ toast('Sem PP.', 'fail'); return; }
    if(!this._zActive && !this._maxActive) move.pp--;
    this.mode = 'main';
    this.lock = true;
    this._render();

    const eMove = this._pickAIMove();

    // turn order by priority, then effective speed (weather/terrain abilities included)
    const pSpeed = core.effStat(this.pMon, 'speed') * core.abilitySpeedMult(this.pMon, this.weather);
    const eSpeed = core.effStat(this.eMon, 'speed') * core.abilitySpeedMult(this.eMon, this.weather);
    const pPrio = core.movePriority(move);
    const ePrio = eMove ? core.movePriority(eMove) : 0;
    // quick claw: small chance to ignore speed
    const pQuick = this.pMon._heldData?.effect==='quickclaw' && Math.random()<0.2;
    // ---- FIX D: tiebreak random quando speeds sao iguais (canonical) ----
    // antes: pSpeed >= eSpeed => empate sempre vai pro jogador
    const speedTie = pSpeed === eSpeed;
    const speedWin = speedTie ? Math.random() < 0.5 : pSpeed > eSpeed;
    const playerFirst = pPrio !== ePrio ? pPrio > ePrio : (pQuick ? true : speedWin);
    const pCtx = { z:this._zActive, max:this._maxActive };

    if(playerFirst){
      await this._turnAttack(this.pMon, this.eMon, move, false, pCtx);
      if(this.eMon.hp > 0) await this._turnAttack(this.eMon, this.pMon, eMove, true, {});
    } else {
      await this._turnAttack(this.eMon, this.pMon, eMove, true, {});
      if(this.pMon.hp > 0) await this._turnAttack(this.pMon, this.eMon, move, false, pCtx);
    }

    await this._endTurn();
  }

  /* wraps status-check + execution for one attacker */
  async _turnAttack(attacker, defender, move, attackerIsEnemy, gctx){
    if(!move || attacker.hp<=0) return;
    if(attacker._flinched){
      attacker._flinched = false;
      this.log.push(`${(attacker.nickname||attacker.name).toUpperCase()} hesitou e não conseguiu atacar!`);
      this._render(); await wait(600);
      return;
    }
    const pre = core.preMoveStatus(attacker);
    if(pre.message){ this.log.push(pre.message); this._render(); await wait(650); }
    if(!pre.canAct) return;
    // confusion check
    if(attacker._confused){
      const c = core.tickConfusion(attacker);
      if(c.cleared){ this.log.push(`${(attacker.nickname||attacker.name).toUpperCase()} saiu da confusão!`); this._render(); await wait(550); }
      else if(c.hitsSelf){
        const self = Math.max(1, Math.floor(((2*attacker.level/5+2)*40*(attacker.stats.attack/attacker.stats.defense))/50)+2);
        attacker.hp = Math.max(0, attacker.hp - self);
        this.log.push(`${(attacker.nickname||attacker.name).toUpperCase()} está confuso e se feriu!`);
        if(attackerIsEnemy) this._playerHurt=false; else this._enemyHurt=false;
        this._render(); await wait(700);
        return;
      }
    }
    await this._executeAttack(attacker, defender, move, attackerIsEnemy, gctx||{});
  }

  async _executeAttack(attacker, defender, move, attackerIsEnemy, gctx={}){
    if(!move){ return; }
    const attName = (attacker.nickname || attacker.name).toUpperCase();
    const isZ = !!gctx.z, isMax = !!gctx.max;
    // two-turn (charge) moves: first use charges, then auto-fires
    // ---- PHASE 1: Power Herb pula charge (uma vez) ----
    const powerHerbSkip = attacker._heldData?.effect==='powerherb' && !attacker._powerHerbUsed;
    if(core.isChargeMove(move.name) && !isZ && !isMax && attacker._charging !== move.name
       && !core.chargeSkippedByWeather(move.name, this.weather)
       && !powerHerbSkip){
      attacker._charging = move.name;
      this.log.push(`${attName} ${core.CHARGE_MOVES[move.name]}`);
      this._render(); await wait(700);
      return;
    }
    if(core.isChargeMove(move.name) && powerHerbSkip){
      attacker._powerHerbUsed = true;
      attacker._heldData = null;
      this.log.push(`${attName} usou a Erva Poder para pular a recarga!`);
    }
    attacker._charging = null;
    // ---- PHASE 6: Z-signature detection ----
    let zSig = null;
    if(isZ){
      const heldRaw = ITEMS[attacker.held];
      if(heldRaw?.signature){
        zSig = core.zSignatureFor(attacker.id, heldRaw.signature);
      }
    }
    // BUG FIX M3: status moves no Dyna viram Max Guard — label deve refletir isso
    const movIsStatus = (!move.power || move.power === 0) && move.damage_class === 'status';
    let label = move.name.replace(/-/g,' ').toUpperCase();
    if(isZ)  label = (zSig ? zSig.name : core.zMoveName(move.type)).toUpperCase();
    if(isMax){
      if(movIsStatus){
        label = (this._gmaxFor(attacker) ? 'G-MAX ' : 'MAX ') + 'GUARDA';
      } else {
        label = core.maxMoveName(move.type, this._gmaxFor(attacker)).toUpperCase();
      }
    }
    this.log.push(`${attName} usou <b>${label}</b>!`);
    this._render();
    await wait(450);

    const isStatus = (!move.power || move.power === 0) && move.damage_class === 'status';

    // ----- Status / non-damaging moves -----
    if(isStatus && !isZ && !isMax){
      await this._applyStatusMove(attacker, defender, move, attackerIsEnemy);
      return;
    }
    // ---- FIX #3: Max Guard ----
    // Dynamax + status move = Max Guard: bloqueia o proximo ataque do oponente
    // (canonical Gen 8). Substitui o caminho de dano com BP=40 default.
    if(isMax && isStatus){
      attacker._maxGuard = true;
      this.log.push(`${attName} ergueu uma <b>Maxiguarda</b>! O proximo golpe sera bloqueado!`);
      this._render(); await wait(600);
      return;
    }
    // Z-status move: buff the user
    if(isZ && isStatus){
      // BUG FIX M4: prioriza Z-signature (Extreme Evoboost etc) sobre generic
      if(zSig && zSig.effect?.kind === 'allStatsUp'){
        this._buff(attacker, 'all', zSig.effect.stages || 1, attackerIsEnemy);
        this.log.push(`${attName} ativou <b>${zSig.name}</b>!`);
        this._render(); await wait(700);
        return;
      }
      const z = core.zStatusEffect(move.type);
      this._buff(attacker, z.stat, z.stages, attackerIsEnemy);
      this.log.push(`${attName} se preparou com o poder Z!`);
      this._render(); await wait(600);
      return;
    }

    // accuracy check (with stages)
    if(!this._accuracyHit(attacker, defender, move)){
      this.log.push(`O ataque de ${attName} errou!`);
      this._render(); await wait(550);
      return;
    }

    // ----- Damage -----
    // ---- FIX #3: Max Guard bloqueia o ataque (uma vez) ----
    if(defender._maxGuard){
      defender._maxGuard = false;
      this.log.push(`A Maxiguarda de ${(defender.nickname||defender.name).toUpperCase()} bloqueou o ataque!`);
      this._render(); await wait(600);
      return;
    }
    // ability absorptions / immunities
    const absorb = core.abilityAbsorb(defender, move);
    if(absorb && absorb.immune){
      this.log.push(absorb.message);
      if(absorb.heal){ defender.hp = Math.min(defender.maxHp, defender.hp + Math.floor(defender.maxHp*absorb.heal)); }
      this._render(); await wait(650);
      return;
    }
    const eff = typeMultiplier(move.type, defender.types);
    if(eff === 0){
      this.log.push(`Não afetou ${(defender.nickname||defender.name).toUpperCase()}…`);
      this._render(); await wait(600);
      return;
    }
    // ---- PHASE 1: held items que afetam crit ----
    let critStage = 0;
    if(attacker._heldData?.effect==='critstage') critStage += 1; // Scope Lens
    if(attacker._heldData?.effect==='critup' && attacker.hp <= attacker.maxHp/4){
      critStage += 2; // Lansat Berry: pinch boost
    }
    const crit = core.rollCrit(critStage);
    let basePower = move.power || 40;
    if(isZ){
      // PHASE 6: Z-signature override de basePower e tipo do dano
      if(zSig){
        basePower = zSig.basePower;
        if(zSig.basePower === 0){
          // Status Z (Extreme Evoboost: +2 all stats)
          if(zSig.effect?.kind === 'allStatsUp'){
            this._buff(attacker, 'all', zSig.effect.stages || 1, attackerIsEnemy);
            this.log.push(`${attName} ativou o Movimento Z assinatura!`);
            this._render(); await wait(600);
            return;
          }
        }
      } else {
        basePower = core.zPower(basePower);
      }
    }
    if(isMax) basePower = core.maxBasePower(move.power || 40);

    let dmg = this._damage(attacker, defender, move, basePower, crit);
    // ability damage modifiers
    dmg = Math.floor(dmg * core.abilityAtkMult(attacker, move) * core.abilityDefMult(defender, move));
    dmg = Math.floor(dmg * core.abilityAtkMultExtra(attacker, move, eff));
    // terrain
    dmg = Math.floor(dmg * core.terrainMoveMult(move.type, this.terrain, core.isGrounded(attacker)));
    // screens (defender side)
    const defSide = attackerIsEnemy ? this.pSide : this.eSide;
    if(!crit) dmg = Math.floor(dmg * core.screenMult(defSide, move));
    // weather
    dmg = Math.floor(dmg * core.weatherDamageMult(move.type, this.weather));
    // ---- PHASE 1: Held items — damage modifiers no atacante ----
    const hd = attacker._heldData;
    if(hd){
      if(hd.effect==='lifeorb') dmg = Math.floor(dmg * 1.3);
      if(hd.effect==='expertbelt' && eff > 1) dmg = Math.floor(dmg * 1.2);
      // Muscle Band / Wise Glasses
      if(hd.effect==='physboost' && move.damage_class==='physical') dmg = Math.floor(dmg * (hd.mult||1.1));
      if(hd.effect==='specboost' && move.damage_class==='special')  dmg = Math.floor(dmg * (hd.mult||1.1));
      // Type-boost items (charcoal, magnet, miracle-seed, etc — 17 itens)
      if(hd.effect==='typeboost' && hd.boostType === move.type) dmg = Math.floor(dmg * (hd.mult||1.2));
      // Gems (one-shot 1.3x do tipo)
      if(hd.effect==='gem' && hd.gemType === move.type && !attacker._gemUsed){
        dmg = Math.floor(dmg * (hd.mult||1.3));
        attacker._gemUsed = true;
        this.log.push(`A ${(hd.gemType||'').toUpperCase()} Gem fortaleceu o golpe!`);
      }
      // Metronome (item) — turnos consecutivos com o mesmo move +20%/turno cap +100%
      if(hd.effect==='metronome'){
        if(attacker._lastMove === move.name){
          attacker._metroStacks = Math.min(5, (attacker._metroStacks||0) + 1);
        } else {
          attacker._metroStacks = 0;
        }
        const mult = 1 + 0.2 * attacker._metroStacks;
        if(mult > 1) dmg = Math.floor(dmg * mult);
      }
    }
    // ---- Defesa: Eviolite (+50% defesas se ainda evolui) ----
    // (aplicado como divisor no dmg pra equivalência)
    if(defender._heldData?.effect==='eviolite' && defender._canStillEvolve){
      dmg = Math.floor(dmg / 1.5);
    }
    if(attacker._mega) dmg = Math.floor(dmg * 1.05);

    // focus sash on defender (or Sturdy)
    let sash = false;
    if(defender._heldData?.effect==='sash' && !defender._sashUsed && defender.hp === defender.maxHp && dmg >= defender.hp){
      dmg = defender.hp - 1; defender._sashUsed = true; sash = true;
    } else if(core.abilitySturdy(defender, dmg)){
      dmg = defender.hp - 1; sash = true;
    }
    defender.hp = Math.max(0, defender.hp - dmg);
    attacker._lastMove = move.name; // pra Metronome (item)
    if(attackerIsEnemy) this._playerHurt = true; else this._enemyHurt = true;
    // ---- PHASE 1: BATTLE JUICE ----
    // Critical hit = flash branco no scene
    if(crit){
      this._critFlash = true;
      audio.playSfx('badge');
      setTimeout(()=>{ this._critFlash = false; this._render(); }, 280);
    }
    // Dano alto (>25% maxHp) = screen shake
    if(dmg > defender.maxHp * 0.25){
      this._screenShake = true;
      setTimeout(()=>{ this._screenShake = false; this._render(); }, 350);
    }
    audio.playSfx('throw');
    this._render();
    setTimeout(()=>{ this._enemyHurt=false; this._playerHurt=false; this._render(); }, 240);

    if(crit){ this.log.push('Um golpe crítico!'); }
    if(eff >= 2)      this.log.push(`Foi <b>super eficaz!</b> (${dmg})`);
    else if(eff < 1)  this.log.push(`Não foi muito eficaz… (${dmg})`);
    else              this.log.push(`Causou ${dmg} de dano.`);
    if(sash) this.log.push(`${(defender.nickname||defender.name).toUpperCase()} segurou firme com a Faixa Foco!`);
    this._render(); await wait(650);

    // ----- Secondary effects -----
    // Life Orb recoil
    if(hd?.effect==='lifeorb' && defender.hp>=0){
      const recoil = Math.max(1, Math.floor(attacker.maxHp/10));
      attacker.hp = Math.max(0, attacker.hp - recoil);
      this.log.push(`${attName} perdeu PS pelo Orbe Vida.`);
      this._render(); await wait(450);
    }
    // ---- PHASE 1: pos-dano held items ----
    // Shell Bell: cura 1/8 do dano causado
    if(hd?.effect==='shellbell' && dmg > 0 && attacker.hp > 0 && attacker.hp < attacker.maxHp){
      const heal = Math.max(1, Math.floor(dmg / 8));
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      this.log.push(`${attName} recuperou PS com o Sino Concha!`);
      this._render(); await wait(400);
    }
    // Air Balloon: estoura ao tomar dano direto (vira grounded)
    if(defender._heldData?.effect==='airballoon' && dmg > 0 && defender.hp > 0){
      this.log.push(`O Balão de Ar de ${(defender.nickname||defender.name).toUpperCase()} estourou!`);
      defender._heldData = null;
      this._render(); await wait(400);
    }
    // Weakness Policy: +2 ATK e +2 SP.ATK ao levar golpe super eficaz
    if(defender._heldData?.effect==='weaknesspolicy' && eff > 1 && dmg > 0 && defender.hp > 0){
      defender._stages = defender._stages || core.freshStages();
      defender._stages.attack = Math.min(6, (defender._stages.attack||0) + 2);
      defender._stages['special-attack'] = Math.min(6, (defender._stages['special-attack']||0) + 2);
      defender._heldData = null;
      this.log.push(`${(defender.nickname||defender.name).toUpperCase()} ativou a Política Fraqueza!`);
      this._render(); await wait(500);
    }
    // Absorb Bulb: +1 SPA ao ser atingido por golpe de Água
    if(defender._heldData?.effect==='absorbbulb' && move.type==='water' && dmg > 0 && defender.hp > 0){
      defender._stages = defender._stages || core.freshStages();
      defender._stages['special-attack'] = Math.min(6, (defender._stages['special-attack']||0) + 1);
      defender._heldData = null;
      this.log.push(`O Bulbo Absorção fortaleceu o Atq. Esp. de ${(defender.nickname||defender.name).toUpperCase()}!`);
      this._render(); await wait(500);
    }
    // Cell Battery: +1 ATK ao ser atingido por golpe Elétrico
    if(defender._heldData?.effect==='cellbattery' && move.type==='electric' && dmg > 0 && defender.hp > 0){
      defender._stages = defender._stages || core.freshStages();
      defender._stages.attack = Math.min(6, (defender._stages.attack||0) + 1);
      defender._heldData = null;
      this.log.push(`A Pilha fortaleceu o Ataque de ${(defender.nickname||defender.name).toUpperCase()}!`);
      this._render(); await wait(500);
    }
    // Rocky Helmet on defender
    if(defender._heldData?.effect==='rockyhelmet' && core.makesContact(move) && attacker.hp>0){
      const r = Math.max(1, Math.floor(attacker.maxHp/6));
      attacker.hp = Math.max(0, attacker.hp - r);
      this.log.push(`${attName} se feriu no Elmo Rochoso!`);
      this._render(); await wait(450);
    }
    // Contact abilities on defender (rough-skin / static / flame-body / poison-point)
    if(defender.hp > 0 && attacker.hp > 0){
      const cev = core.abilityContact(defender, attacker, move);
      for(const e of cev){ this.log.push(e.message); this._render(); await wait(450); }
    }
    // Draining moves heal the attacker for ~50% of damage dealt
    // BUG FIX M1: Dream Eater + Bitter Blade nao estavam no regex de drain
    if(/drain|absorb|mega-drain|giga-drain|leech-life|drain-punch|horn-leech|dream-eater|bitter-blade|parabolic-charge|oblivion-wing/.test(move.name) && dmg>0 && attacker.hp>0){
      const heal = Math.max(1, Math.floor(dmg*0.5));
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      this.log.push(`${attName} drenou energia e recuperou PS!`);
      this._render(); await wait(450);
    }
    // Recoil moves hurt the attacker (~25%)
    if(/take-down|double-edge|submission|wood-hammer|head-smash|flare-blitz|brave-bird|wild-charge|volt-tackle/.test(move.name) && dmg>0 && attacker.hp>0){
      const recoil = Math.max(1, Math.floor(dmg*0.25));
      attacker.hp = Math.max(0, attacker.hp - recoil);
      this.log.push(`${attName} sofreu o recuo do golpe!`);
      this._render(); await wait(450);
    }
    // Flinch chance from King's Rock / flinch moves (only matters if attacker moved first)
    if(attacker._heldData?.effect==='flinch' && defender.hp>0 && Math.random()<0.1){
      defender._flinched = true;
    }
    // Move ailment chance (≈30%) — only for normal moves with an ailment
    if(!isZ && !isMax && move.meta?.ailment && move.meta.ailment!=='none' && defender.hp>0){
      const ail = mapAilment(move.meta.ailment);
      if(ail && Math.random() < 0.3){
        const r = core.applyStatus(defender, ail);
        if(r.ok){ this.log.push(`${(defender.nickname||defender.name).toUpperCase()} ficou ${core.statusName(ail)}!`); this._render(); await wait(550); }
      }
    }
    // Max move side effect
    if(isMax){
      await this._applyMaxEffect(attacker, defender, move, attackerIsEnemy);
    }
    // PHASE 6: Z-signature post-hit effects (terrain etc)
    if(isZ && zSig?.effect?.kind === 'terrain'){
      this.terrain = zSig.effect.value;
      this.terrainTurns = 5;
      this.log.push(`O ${core.TERRAIN[zSig.effect.value]} se manifestou!`);
      this._render(); await wait(550);
    }
  }

  _accuracyHit(attacker, defender, move){
    if(move.accuracy == null) return true;
    const aStage = attacker._stages?.accuracy || 0;
    const eStage = defender._stages?.evasion || 0;
    const net = Math.max(-6, Math.min(6, aStage - eStage));
    let acc = move.accuracy * core.accMult(net);
    // ---- PHASE 1: held item accuracy modifiers ----
    // Wide Lens — +10% precisao do atacante
    if(attacker._heldData?.effect==='accuracy') acc *= (attacker._heldData.mult || 1.1);
    // Bright Powder — -10% precisao do golpe inimigo
    if(defender._heldData?.effect==='evasion') acc *= 1 / (defender._heldData.mult || 1.1);
    return Math.random()*100 < acc;
  }

  _damage(attacker, defender, move, basePower, crit){
    const lvl = attacker.level;
    const special = move.damage_class === 'special';
    let atk = core.effStat(attacker, special ? 'special-attack' : 'attack');
    let def = core.effStat(defender, special ? 'special-defense' : 'defense');
    if(crit){ // crits ignore negative atk stages / positive def stages → approximate by using raw
      atk = Math.max(atk, attacker.stats[special?'special-attack':'attack']);
      def = Math.min(def, defender.stats[special?'special-defense':'defense']);
    }
    let dmg = (((2*lvl/5 + 2) * basePower * (atk/def)) / 50) + 2;
    if((attacker.types||[]).includes(move.type)) dmg *= 1.5; // STAB
    dmg *= typeMultiplier(move.type, defender.types);
    if(crit) dmg *= 1.5;
    // PHASE 3: usa rng deterministico em PvP
    dmg *= 0.85 + this._rng()*0.15;
    return Math.max(1, Math.floor(dmg));
  }

  /* Apply a non-damaging status move: ailments + stat changes + field */
  async _applyStatusMove(attacker, defender, move, attackerIsEnemy){
    const attName = (attacker.nickname||attacker.name).toUpperCase();
    // ---- FIX #3: Max Guard tambem bloqueia status moves do oponente ----
    // (selfBuffs setam target=attacker entao nao impactam; tratamos a baixo apenas
    //  o que MIRA o defender)
    let did = false;
    // BUG FIX M2: weather moves (Sunny Day, Rain Dance, Sandstorm, Hail)
    const wth = core.moveSetsWeather(move.name);
    if(wth){
      this.weather = wth;
      this.weatherTurns = 5;
      this.log.push(`${attName} mudou o clima para <b>${core.WEATHER[wth]}</b>!`);
      this._render(); await wait(600); return;
    }
    // terrain
    const ter = core.moveSetsTerrain(move.name);
    if(ter){ this.terrain = ter; this.terrainTurns = 5; this.log.push(`${attName} criou o ${core.TERRAIN[ter]}!`); this._render(); await wait(600); return; }
    // screens (attacker's own side)
    const scr = core.moveSetsScreen(move.name);
    if(scr){
      const side = attackerIsEnemy ? this.eSide : this.pSide;
      // ---- PHASE 1: Light Clay estende screens (5→8 turnos) ----
      side[scr] = (attacker._heldData?.effect==='lightclay') ? 8 : 5;
      this.log.push(`Uma barreira protege o time de ${attName}!`);
      this._render(); await wait(600); return;
    }
    // hazards (opponent's side)
    const haz = core.moveSetsHazard(move.name);
    if(haz){ const side = attackerIsEnemy ? this.pSide : this.eSide; if(haz==='spikes') side.spikes=Math.min(3,side.spikes+1); else if(haz==='toxicspikes') side.toxicspikes=Math.min(2,side.toxicspikes+1); else side[haz]=true; this.log.push(`${attName} espalhou perigos no campo inimigo!`); this._render(); await wait(600); return; }
    // confusion-inducing moves
    if(/confuse|swagger|flatter|confusion-ray|supersonic|teeter-dance/.test(move.name)){
      if(core.applyConfusion(defender)){ this.log.push(`${(defender.nickname||defender.name).toUpperCase()} ficou confuso!`); this._render(); await wait(600); }
      return;
    }
    // heal moves
    if(/recover|roost|soft-boiled|milk-drink|slack-off|heal-order|rest/.test(move.name)){
      const heal = Math.floor(attacker.maxHp/2); attacker.hp = Math.min(attacker.maxHp, attacker.hp+heal);
      if(move.name==='rest'){ attacker.status='asleep'; attacker._sleepTurns=2; attacker.hp=attacker.maxHp; }
      this.log.push(`${attName} recuperou PS!`); this._render(); await wait(600); return;
    }
    // ailment moves (will-o-wisp, thunder-wave, toxic, sleep-powder…)
    const ail = mapAilment(move.meta?.ailment);
    if(ail){
      // FIX #3: Max Guard bloqueia status condition no defender
      if(defender._maxGuard){
        defender._maxGuard = false;
        this.log.push(`A Maxiguarda de ${(defender.nickname||defender.name).toUpperCase()} bloqueou!`);
        this._render(); await wait(550);
        return;
      }
      if(!this._accuracyHit(attacker, defender, move)){ this.log.push('Mas errou!'); this._render(); await wait(500); return; }
      if(core.terrainBlocksStatus(this.terrain, ail, core.isGrounded(defender)) || core.abilityStatusImmune(defender, ail)){
        this.log.push('Mas não teve efeito.'); this._render(); await wait(500); return;
      }
      const r = core.applyStatus(defender, ail);
      if(r.ok){ this.log.push(`${(defender.nickname||defender.name).toUpperCase()} ficou ${core.statusName(ail)}!`); did=true; }
      else this.log.push('Mas não teve efeito.');
      this._render(); await wait(600);
      return;
    }
    // self-buff heuristics by move name
    const buffs = guessStatChange(move.name);
    if(buffs){
      const target = buffs.self ? attacker : defender;
      const tEnemy = buffs.self ? attackerIsEnemy : !attackerIsEnemy;
      this._buff(target, buffs.stat, buffs.stages, tEnemy);
      did = true;
      this._render(); await wait(550);
      return;
    }
    if(!did){ this.log.push(`${attName} usou ${move.name.replace(/-/g,' ').toUpperCase()}, mas não teve efeito notável.`); this._render(); await wait(500); }
  }

  _buff(mon, stat, stages, isEnemy){
    const name = (mon.nickname||mon.name).toUpperCase();
    const keys = stat==='all' ? ['attack','defense','special-attack','special-defense','speed'] : [stat];
    for(const k of keys){
      const cur = mon._stages[k] || 0;
      mon._stages[k] = Math.max(-6, Math.min(6, cur + stages));
    }
    const word = stages>0 ? 'aumentou' : 'diminuiu';
    const lbl = stat==='all' ? 'os atributos' : (TYPE_LABEL_STAT[stat]||stat);
    this.log.push(`${name} ${word} ${lbl}${Math.abs(stages)>1?' bruscamente':''}!`);
  }

  async _applyMaxEffect(attacker, defender, move, attackerIsEnemy){
    const fx = core.maxMoveEffect(move.type);
    if(!fx) return;
    if(fx.kind==='weather'){
      this.weather = fx.value; this.weatherTurns = 5;
      this.log.push(`O clima mudou: <b>${core.WEATHER[fx.value]}</b>!`);
    } else if(fx.kind==='selfStat'){
      this._buff(attacker, fx.stat, fx.stages, attackerIsEnemy);
    } else if(fx.kind==='enemyStat'){
      this._buff(defender, fx.stat, fx.stages, !attackerIsEnemy);
    }
    this._render(); await wait(600);
  }

  _pickAIMove(){
    const moves = (this.eMon.moves || []).filter(m=>m.pp>0);
    if(moves.length === 0) return null;
    const target = this.pMon;
    // ---- PHASE 4: AI awareness ----
    // Score = power * typeEff * accuracy * STAB - penalty se imune por ability
    const scoreMove = (m) => {
      const power = m.power || 0;
      const eff = typeMultiplier(m.type, target.types);
      if (eff === 0) return -1; // type-immune
      // Ability absorptions/immunities (Levitate, Flash Fire, Water/Volt Absorb)
      const absorb = core.abilityAbsorb(target, m);
      if (absorb?.immune) return -1;
      const acc = (m.accuracy ?? 100) / 100;
      const stab = (this.eMon.types || []).includes(m.type) ? 1.5 : 1;
      // Status moves: score baixo (~30) — preferido só se nada bate
      if (power === 0) {
        // Buffs/curas tem valor proporcional a HP%
        const hpRatio = this.eMon.hp / this.eMon.maxHp;
        if (/recover|roost|soft-boiled|milk-drink|rest/.test(m.name) && hpRatio < 0.5) return 80;
        if (/swords-dance|dragon-dance|nasty-plot|calm-mind|agility|bulk-up/.test(m.name) && hpRatio > 0.7) return 50;
        if (m.meta?.ailment && m.meta.ailment !== 'none' && (!target.status || target.status === 'none')) return 40;
        return 20; // status moves fallback
      }
      return power * eff * acc * stab;
    };
    // tem moves com efeito? Pega o melhor; com pequena chance de variar (10%)
    const scored = moves.map(m => ({ m, s: scoreMove(m) }));
    scored.sort((a,b)=>b.s - a.s);
    // Se top score for negativo (so opcoes inertes), pega aleatorio
    if (scored[0].s < 0) return moves[Math.floor(Math.random()*moves.length)];
    // 10% chance de pegar o 2o melhor pra variar (anti-decorar)
    if (scored.length > 1 && scored[1].s > 0 && Math.random() < 0.1) return scored[1].m;
    return scored[0].m;
  }

  async _endTurn(){
    // consume one-shot Z and tick down Dynamax
    if(this._zActive) this._zActive = false;
    this._endMaxIfNeeded();

    // ---- FIX C: ordem canonical Gen 5+ de end-of-turn ----
    // 1. Weather chip damage (sand/hail)
    // 2. Terrain heal (grassy)
    // 3. Status residual (poison, burn)
    // 4. Ability end-of-turn (speed-boost, etc)
    // 5. Held items: leftovers
    // 6. Held items: berries (sitrus, etc) — POR ULTIMO, para reagir ao
    //    HP final do turno (era o bug: sitrus procava antes do weather chip)

    // ----- 1. Weather chip -----
    if(this.weather==='sandstorm' || this.weather==='hail'){
      for(const mon of [this.pMon, this.eMon]){
        if(!mon || mon.hp<=0) continue;
        const immuneSand = this.weather==='sandstorm' && (mon.types||[]).some(t=>['rock','ground','steel'].includes(t));
        const immuneHail = this.weather==='hail' && (mon.types||[]).includes('ice');
        if(immuneSand || immuneHail) continue;
        const d = Math.max(1, Math.floor(mon.maxHp/16));
        mon.hp = Math.max(0, mon.hp - d);
      }
      this.log.push(this.weather==='sandstorm' ? 'A tempestade de areia castiga!' : 'O granizo castiga!');
      this._render(); await wait(450);
    }
    // ----- 2. Terrain heal (grassy) -----
    if(this.terrain==='grassy'){
      for(const mon of [this.pMon,this.eMon]){
        if(mon && mon.hp>0 && mon.hp<mon.maxHp && core.isGrounded(mon)){
          mon.hp = Math.min(mon.maxHp, mon.hp + Math.floor(mon.maxHp/16));
        }
      }
    }
    // ----- 3-6. Por mon: status, ability, leftovers, berries, orbs -----
    for(const mon of [this.pMon, this.eMon]){
      if(!mon || mon.hp<=0) continue;
      const nm = (mon.nickname||mon.name).toUpperCase();
      // 3. status residual
      const evs = core.endOfTurnStatus(mon);
      for(const e of evs){ this.log.push(e.message); this._render(); await wait(550); }
      if(mon.hp<=0) continue;
      // 4. ability end-of-turn
      const aev = core.abilityEndOfTurn(mon);
      for(const e of aev){ this.log.push(e.message); this._render(); await wait(420); }
      // ---- PHASE 1: Flame Orb / Toxic Orb auto-inflingem status ----
      if(mon._heldData?.effect==='flameorb' && (!mon.status || mon.status==='none')){
        const r = core.applyStatus(mon, 'burned');
        if(r.ok){ this.log.push(`${nm} foi queimado pelo Orbe Chama!`); this._render(); await wait(450); }
      }
      if(mon._heldData?.effect==='toxicorb' && (!mon.status || mon.status==='none')){
        const r = core.applyStatus(mon, 'poisoned');
        if(r.ok){ this.log.push(`${nm} foi envenenado pelo Orbe Tóxico!`); this._render(); await wait(450); }
      }
      // ---- PHASE 1: Black Sludge — cura poison, fere outros ----
      if(mon._heldData?.effect==='blacksludge'){
        if((mon.types||[]).includes('poison')){
          if(mon.hp < mon.maxHp){
            const heal = Math.max(1, Math.floor(mon.maxHp/16));
            mon.hp = Math.min(mon.maxHp, mon.hp + heal);
            this.log.push(`${nm} recuperou PS com a Casca Preta.`);
            this._render(); await wait(400);
          }
        } else {
          const d = Math.max(1, Math.floor(mon.maxHp/8));
          mon.hp = Math.max(0, mon.hp - d);
          this.log.push(`${nm} sofreu com a Casca Preta!`);
          this._render(); await wait(400);
        }
      }
      // ---- PHASE 1: Mental Herb — cura confusao + ailments mentais ----
      if(mon._heldData?.effect==='mentalherb' && mon._confused){
        mon._confused = 0;
        mon._heldData = null;
        this.log.push(`${nm} clareou a mente com a Erva Mental!`);
        this._render(); await wait(400);
      }
      // 5. leftovers
      if(mon._heldData?.effect==='leftovers' && mon.hp < mon.maxHp){
        const heal = Math.max(1, Math.floor(mon.maxHp/16));
        mon.hp = Math.min(mon.maxHp, mon.hp + heal);
        this.log.push(`${nm} recuperou PS com os Restos.`);
        this._render(); await wait(450);
      }
      // 6. Berries (sitrus, oran, lum) — reagem ao HP final
      // Sitrus: cura 25% quando <= 50%
      if(mon._heldData?.effect==='sitrus' && mon.hp <= mon.maxHp*0.5 && !mon._sitrusUsed){
        mon._sitrusUsed = true;
        const heal = Math.floor(mon.maxHp*0.25);
        mon.hp = Math.min(mon.maxHp, mon.hp + heal);
        this.log.push(`${nm} comeu a Baga Sitrus e recuperou PS!`);
        mon._heldData = null;
        this._render(); await wait(500);
      }
      // ---- PHASE 1: Oran Berry — cura 10 fixos quando <= 50% ----
      if(mon._heldData?.effect==='oran' && mon.hp <= mon.maxHp*0.5){
        mon.hp = Math.min(mon.maxHp, mon.hp + 10);
        this.log.push(`${nm} comeu a Baga Oran! (+10 PS)`);
        mon._heldData = null;
        this._render(); await wait(450);
      }
      // ---- PHASE 1: Lum Berry — cura qualquer status ativo ----
      if(mon._heldData?.effect==='lumberry' && mon.status && mon.status!=='none'){
        mon.status = 'none';
        mon._heldData = null;
        this.log.push(`${nm} comeu a Baga Lum e curou sua condição!`);
        this._render(); await wait(450);
      }
    }
    // ----- decrement timers -----
    if(this.weatherTurns>0){ this.weatherTurns--; if(this.weatherTurns===0 && this.weather!=='none'){ this.log.push(`O clima voltou ao normal.`); this.weather='none'; } }
    if(this.terrainTurns>0){ this.terrainTurns--; if(this.terrainTurns===0 && this.terrain!=='none'){ this.log.push(`O ${core.TERRAIN[this.terrain]} dissipou.`); this.terrain='none'; } }
    // decrement screen timers
    for(const side of [this.pSide, this.eSide]){ if(side.reflect>0) side.reflect--; if(side.lightscreen>0) side.lightscreen--; if(side.auroraveil>0) side.auroraveil--; }

    // check faints
    if(this.eMon.hp <= 0){
      this.log.push(`${this.eMon.name.toUpperCase()} foi nocauteado!`);
      this._render(); await wait(700);
      // XP gain
      await this._gainXp(this.eMon);
      // next enemy?
      const nextE = this.enemyTeam.findIndex((m,i)=>i>this.eIdx && m.hp>0);
      if(nextE >= 0){
        this.eIdx = nextE;
        this.log.push(`${this.opts.enemyLabel} mandou <b>${this.eMon.name.toUpperCase()}</b>!`);
        this._render(); await wait(700);
      } else {
        // victory
        this._finishVictory();
        return;
      }
    }
    if(this.pMon.hp <= 0){
      this.log.push(`${(this.pMon.nickname||this.pMon.name).toUpperCase()} foi nocauteado!`);
      this._render(); await wait(700);
      // Nuzlocke: a fainted mon is released permanently
      if(this.opts.ctx.save.settings?.nuzlocke){
        const dead = this.pMon;
        this.log.push(`Modo Nuzlocke: ${(dead.nickname||dead.name).toUpperCase()} foi liberado para sempre…`);
        this._render(); await wait(800);
        this.opts.ctx.save.party = this.opts.ctx.save.party.filter(m=>m.uid!==dead.uid);
        this.playerTeam = this.opts.ctx.save.party;
        this.opts.ctx.saveAndSync();
        this.pIdx = 0;
      }
      const nextP = this.playerTeam.findIndex((m)=>m.hp>0);
      if(nextP >= 0){
        this.pIdx = nextP;
        this.log.push(`Vai, <b>${(this.pMon.nickname||this.pMon.name).toUpperCase()}</b>!`);
        this._render(); await wait(700);
      } else {
        // defeat
        this._finishDefeat();
        return;
      }
    }
    this.lock = false;
    this._render();
  }

  async _gainXp(enemy){
    const { xpForLevel } = await import('./data.js');
    const { recomputeStats } = await import('./mon-stats.js');
    const baseExp = enemy.baseExp || 80;
    const fullGain = Math.max(1, Math.floor((baseExp * enemy.level) / 7));
    // XP Share: the active mon gets full XP; the rest of the (living) party gets half.
    const alive = this.playerTeam.filter(m => m.hp > 0);
    for(const mon of alive){
      const isActive = (mon === this.pMon);
      const gain = isActive ? fullGain : Math.floor(fullGain * 0.5);
      if(gain <= 0) continue;
      mon.xp = (mon.xp||0) + gain;
      mon.friendship = Math.min(255, (mon.friendship||70) + 2);
      this.log.push(`<b>${(mon.nickname||mon.name).toUpperCase()}</b> ganhou ${gain} EXP${isActive?'':' (Compart. Exp.)'}!`);
      this._render(); await wait(280);
      while(mon.level < 100 && mon.xp >= xpForLevel(mon.level+1)){
        mon.level++;
        // ---- FIX #2: recompute TODOS os stats (atk/def/spa/spd/spe), nao so HP ----
        // recomputeStats preserva a proporcao de HP atual.
        if (mon.base && mon.ivs && mon.evs) {
          recomputeStats(mon);
        } else {
          // Fallback para mons antigos sem base/ivs/evs: mantem comportamento antigo (so HP)
          const oldMax = mon.maxHp;
          const newMax = Math.floor((2*mon.stats.hp + 31) * mon.level / 100) + mon.level + 10;
          mon.maxHp = newMax;
          mon.hp = Math.min(mon.maxHp, mon.hp + (newMax - oldMax));
        }
        this.log.push(`<b>${(mon.nickname||mon.name).toUpperCase()}</b> subiu para Lv. ${mon.level}!`);
        audio.playSfx('badge');
        this._render(); await wait(620);
        // queue level-up evolution to play after the battle
        if(!this._evoQueue) this._evoQueue = [];
        if(!this._evoQueue.includes(mon)) this._evoQueue.push(mon);
      }
    }
    this.opts.ctx.saveAndSync();
  }

  _finishVictory(){
    this.mode = 'over';
    this.lock = false;
    const isWild = this.opts.isWild;
    this.lastResult = isWild ? 'ko' : 'win';
    if(!isWild){
      const reward = this.enemyTeam.reduce((a,b)=>a + (b.level||5)*15, 0) + 100;
      this.opts.ctx.save.trainer.money += reward;
      import('./quests.js').then(q=>{ q.questEvent(this.opts.ctx.save, 'win'); this.opts.ctx.saveAndSync(); });
      import('./breeding.js').then(b=>{ if(b.advanceEgg(this.opts.ctx.save, 1)) toast('Um Ovo na creche está pronto para chocar!', 'info'); this.opts.ctx.saveAndSync(); });
      this.log.push(`Você venceu! Recebeu <b>₽${reward.toLocaleString('pt-BR')}</b>.`);
      this.opts.ctx.saveAndSync();
    } else {
      this.log.push(`Você venceu o Pokémon selvagem!`);
    }
    audio.playSfx('success');
    this._render();
  }
  _finishDefeat(){
    this.mode = 'over';
    this.lock = false;
    this.lastResult = this.opts.isWild ? 'flee_wild' : 'lose';
    const fine = Math.min(this.opts.ctx.save.trainer.money, this.opts.isWild?200:500);
    this.opts.ctx.save.trainer.money -= fine;
    this.log.push(`Você foi derrotado… Perdeu ₽${fine.toLocaleString('pt-BR')}.`);
    this.opts.ctx.saveAndSync();
    audio.playSfx('error');
    this._render();
  }

  async _tryRun(){
    if(!this.opts.isWild){
      // Trainer battle — confirm cancel
      const ok = confirm('Desistir desta batalha? Você não receberá recompensas.');
      if(!ok) return;
      this.lastResult = 'lose';
      this._close('lose');
      return;
    }
    this.lock = true;
    this._render();
    // ---- FIX #6: Formula canonical Gen 1+ ----
    // F = ((A*32) / max(1, B/4)) + 30 * C
    // onde A=player speed, B=wild speed (dividido por 4 mod 256), C=attempts+1.
    // Escape se F >= 255 (sempre foge) ou se random(0..255) < F.
    // Speed agora REALMENTE importa: A >> B = quase sempre foge; A << B = raro.
    this._runAttempts = (this._runAttempts || 0) + 1;
    const A = core.effStat(this.pMon, 'speed');  // usa stat efetivo (paralisia etc)
    const B = core.effStat(this.eMon, 'speed');
    const F = Math.floor((A * 32) / Math.max(1, Math.floor(B / 4) % 256)) + 30 * this._runAttempts;
    const escaped = F >= 255 || Math.floor(Math.random() * 256) < F;
    audio.playSfx('cancel');
    if(escaped){
      this.log.push(`Você fugiu em segurança!`);
      this._render();
      await wait(700);
      this._close('flee_player');
      return;
    } else {
      this.log.push(`Não conseguiu fugir!`);
      this._render();
      await wait(550);
      // enemy gets a free turn
      const eMove = this._pickAIMove();
      await this._executeAttack(this.eMon, this.pMon, eMove, true);
      await this._endTurn();
    }
  }

  async _useBall(ballId){
    if(!this.opts.isWild){
      toast('Não pode usar Pokébola em batalha de treinador!', 'fail');
      audio.playSfx('error');
      return;
    }
    const item = ITEMS[ballId];
    const save = this.opts.ctx.save;
    save.bag.balls[ballId] = Math.max(0, (save.bag.balls[ballId]||0)-1);
    if(save.bag.balls[ballId] === 0) delete save.bag.balls[ballId];
    this.mode = 'main';
    this.lock = true;
    this._ballColor = item.color || '#DC3545';
    audio.playSfx('throw');
    this.log.push(`Você jogou uma <b>${item.name}</b>!`);
    // THROW: ball arcs toward the enemy
    this._ballPhase = 'throw';
    this._render();
    await wait(620);
    // SUCK-IN flash: enemy sprite pulled into the ball
    this._captureFlash = true;
    this._enemyCapturing = true;
    this._ballPhase = 'hold';
    this._render();
    await wait(360);
    this._captureFlash = false;
    this._render();
    await wait(200);

    // ---- PHASE 3: Capture overhaul canonical ----
    // 1. catchRate por espécie (busca PokeAPI species, fallback 100)
    // 2. StatusBonus: sleep/freeze ×2.5, par/brn/psn ×1.5
    // 3. ballTag contextual (Net/Dive/Quick/Dream/Repeat/Nest)
    // 4. Master ball sempre captura
    const enemy = this.eMon;
    const hpRatio = enemy.hp / enemy.maxHp;

    const isMaster = item.ballTag === 'master' || (item.mult || 0) >= 255;
    let chance, success;
    if (isMaster) {
      chance = 1; success = true;
    } else {
      // (a) catch rate por espécie
      let catchRate = 100; // fallback (taxa media)
      try {
        const sp = await api.getSpecies(enemy.id);
        if(sp && typeof sp.capture_rate === 'number') catchRate = sp.capture_rate;
      } catch {}
      // (b) ball bonus baseado em ballTag contextual
      let ballBonus = item.mult || 1;
      const tag = item.ballTag;
      this._captureAttempts = (this._captureAttempts || 0);
      if(tag === 'water/bug' && (enemy.types||[]).some(t=>t==='water'||t==='bug')) ballBonus = 3.5;
      else if(tag === 'water' && (enemy.types||[]).includes('water'))                ballBonus = 3.5;
      else if(tag === 'firstturn' && this._captureAttempts === 0)                    ballBonus = 5;
      else if(tag === 'sleep' && enemy.status === 'asleep')                          ballBonus = 4;
      else if(tag === 'caught' && this.opts.ctx.save.pokedex.caught[enemy.id])       ballBonus = 3;
      else if(tag === 'lowlevel') {
        ballBonus = Math.max(1, Math.min(4, (41 - (enemy.level||1)) / 10));
      }
      else if(tag === 'night' || tag === 'lateturn') ballBonus = (item.mult || 1); // simplificado
      // (c) status bonus
      let statusBonus = 1;
      if(enemy.status === 'asleep' || enemy.status === 'frozen') statusBonus = 2.5;
      else if(['paralyzed','burned','poisoned'].includes(enemy.status)) statusBonus = 1.5;
      // (d) formula canonical Gen 5+:
      // a = ((3*max - 2*hp) * catchRate * ball * status) / (3 * max)
      // chance ≈ 1 - (1 - a/255)^4  (4-shake aproximacao)
      const a = ((3*enemy.maxHp - 2*enemy.hp) * catchRate * ballBonus * statusBonus) / (3 * enemy.maxHp);
      const aClamped = Math.max(1, Math.min(255, a));
      chance = 1 - Math.pow(1 - aClamped/255, 4);
      chance = Math.max(0.04, Math.min(1.0, chance));
      success = Math.random() < chance;
      this._captureAttempts++;
    }
    // number of shakes: 3 on success, 0-2 on fail (suspense)
    const shakeCount = success ? 3 : Math.floor(Math.random()*3);
    for(let i=0;i<Math.max(1,shakeCount);i++){
      this._ballPhase = 'shake-'+(i%2===0?'l':'r');
      this._render();
      audio.playSfx('shake');
      await wait(480);
      this._ballPhase = 'hold';
      this._render();
      await wait(160);
    }

    if(success){
      // captured!
      const captured = await makeMon({
        speciesIdOrName: enemy.id,
        level: enemy.level,
        shiny: enemy.shiny,
        ball: ballId,
        source: this.opts.ctx.save.trainer.region || 'wild',
      });
      if(captured){
        captured.hp = Math.max(1, enemy.hp);
        // ---- PHASE 3: ballTag post-capture effects ----
        if(item.ballTag === 'heal'){
          captured.hp = captured.maxHp;
          captured.status = 'none';
          this.log.push('A Heal Ball curou totalmente o Pokémon capturado!');
        }
        if(item.ballTag === 'friend'){
          captured.friendship = Math.min(255, (captured.friendship || 70) + 100);
        }
        if(save.party.length < 6) save.party.push(captured);
        else save.box.push(captured);
        save.pokedex.caught[captured.id] = {
          name: captured.name, types: captured.types, sprite: captured.sprite.front,
          at: Date.now(), region: save.trainer.region, shiny: captured.shiny,
        };
      }
      // GOTCHA: ball clicks shut with stars
      this._ballPhase = 'caught';
      this._render();
      audio.playSfx('capture');
      await wait(900);
      this.log.push(`Gotcha! <b>${enemy.name.toUpperCase()}</b> foi capturado!`);
      this._render(); await wait(500);
      // XP Share also rewards the party on a capture (~60% of a KO)
      await this._gainXp({ ...enemy, baseExp: Math.floor((enemy.baseExp||80)*0.6) });
      this.opts.ctx.saveAndSync();
      this.mode = 'over';
      this.lock = false;
      this.lastResult = 'caught';
      import('./quests.js').then(q=>{ q.questEvent(this.opts.ctx.save, 'catch'); q.questEvent(this.opts.ctx.save, 'win'); this.opts.ctx.saveAndSync(); });
      this._ballPhase = null;
      this._enemyCapturing = false;
      this._render();
      return;
    } else {
      // BREAK FREE: ball bursts open, enemy returns
      this._ballPhase = 'break';
      this._render();
      audio.playSfx('escape');
      await wait(500);
      this._ballPhase = null;
      this._enemyCapturing = false;
      this.log.push(`Oh não! ${enemy.name.toUpperCase()} escapou da Pokébola!`);
      this._render();
      await wait(650);
      const eMove = this._pickAIMove();
      await this._executeAttack(this.eMon, this.pMon, eMove, true);
      await this._endTurn();
    }
  }

  async _useMed(itemId){
    const save = this.opts.ctx.save;
    const item = ITEMS[itemId];
    if(!item) return;
    const before = this.pMon.hp;
    if(item.heal != null){
      this.pMon.hp = Math.min(this.pMon.maxHp, this.pMon.hp + item.heal);
    }
    if(item.cure && this.pMon.status === item.cure) this.pMon.status = 'none';
    save.bag.medicine[itemId] = Math.max(0, (save.bag.medicine[itemId]||0)-1);
    if(save.bag.medicine[itemId] === 0) delete save.bag.medicine[itemId];
    audio.playSfx('heal');
    this.mode = 'main';
    this.lock = true;
    const gained = this.pMon.hp - before;
    this.log.push(`Você usou <b>${item.name}</b>! +${gained} PS.`);
    this.opts.ctx.saveAndSync();
    this._render();
    await wait(500);
    // enemy gets a turn
    const eMove = this._pickAIMove();
    await this._executeAttack(this.eMon, this.pMon, eMove, true);
    await this._endTurn();
  }

  async _switchTo(i){
    audio.playSfx('select');
    this.pIdx = i;
    this._queueSwitchIn(this.pMon, this.eMon);
    this.mode = 'main';
    this.lock = true;
    this.log.push(`Vai, <b>${(this.pMon.nickname||this.pMon.name).toUpperCase()}</b>!`);
    this._render();
    await wait(500);
    // enemy gets a turn
    const eMove = this._pickAIMove();
    await this._executeAttack(this.eMon, this.pMon, eMove, true);
    await this._endTurn();
  }
}

/* ============ helpers ============ */
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function zPower(p){
  if(p <= 55) return 100;
  if(p <= 65) return 120;
  if(p <= 75) return 140;
  if(p <= 85) return 160;
  if(p <= 95) return 175;
  if(p <= 100) return 180;
  if(p <= 110) return 185;
  if(p <= 125) return 190;
  if(p <= 130) return 195;
  return 200;
}
function hits(move){
  if(move.accuracy == null) return true;
  return Math.random()*100 < move.accuracy;
}

const CORE_TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
function effClass(m){
  if(m === 0) return 'none';
  if(m >= 2) return 'super';
  if(m > 1) return 'good';
  if(m < 1) return 'weak';
  return 'neutral';
}
function effLabel(m){
  if(m === 0) return 'Não afeta';
  if(m >= 4) return 'Super eficaz (4×)';
  if(m >= 2) return 'Super eficaz (2×)';
  if(m < 1 && m > 0) return 'Pouco eficaz';
  return 'Dano normal';
}
function effShort(m){
  if(m === 0) return '0×';
  if(m >= 4) return '4×';
  if(m >= 2) return '2×';
  if(m === 0.5) return '½×';
  if(m < 1) return '¼×';
  return '1×';
}

/* PokéAPI ailment name -> our status key */
function mapAilment(a){
  return ({ paralysis:'paralyzed', burn:'burned', freeze:'frozen', poison:'poisoned', sleep:'asleep' })[a] || null;
}
/* heuristic stat-change for common status moves (by move name) */
const TYPE_LABEL_STAT = {
  attack:'o Ataque', defense:'a Defesa', 'special-attack':'o Atq. Esp.',
  'special-defense':'a Def. Esp.', speed:'a Velocidade', accuracy:'a Precisão', evasion:'a Evasão',
};
function guessStatChange(name){
  const M = {
    'swords-dance':{self:true,stat:'attack',stages:2},
    'dragon-dance':{self:true,stat:'attack',stages:1},
    'nasty-plot':{self:true,stat:'special-attack',stages:2},
    'calm-mind':{self:true,stat:'special-attack',stages:1},
    'agility':{self:true,stat:'speed',stages:2},
    'iron-defense':{self:true,stat:'defense',stages:2},
    'amnesia':{self:true,stat:'special-defense',stages:2},
    'bulk-up':{self:true,stat:'attack',stages:1},
    'work-up':{self:true,stat:'attack',stages:1},
    'growth':{self:true,stat:'special-attack',stages:1},
    'howl':{self:true,stat:'attack',stages:1},
    'growl':{self:false,stat:'attack',stages:-1},
    'leer':{self:false,stat:'defense',stages:-1},
    'tail-whip':{self:false,stat:'defense',stages:-1},
    'string-shot':{self:false,stat:'speed',stages:-2},
    'scary-face':{self:false,stat:'speed',stages:-2},
    'screech':{self:false,stat:'defense',stages:-2},
    'charm':{self:false,stat:'attack',stages:-2},
    'sand-attack':{self:false,stat:'accuracy',stages:-1},
    'smokescreen':{self:false,stat:'accuracy',stages:-1},
    'double-team':{self:true,stat:'evasion',stages:1},
    'minimize':{self:true,stat:'evasion',stages:2},
    'harden':{self:true,stat:'defense',stages:1},
    'withdraw':{self:true,stat:'defense',stages:1},
    'defense-curl':{self:true,stat:'defense',stages:1},
  };
  return M[name] || null;
}
function computeDamage(attacker, defender, move){
  const lvl = attacker.level;
  const power = Math.max(20, move.power || 40);
  const atk = move.damage_class === 'special'
    ? (attacker.stats['special-attack'] || attacker.stats.attack || 30)
    : (attacker.stats.attack || 30);
  const def = move.damage_class === 'special'
    ? (defender.stats['special-defense'] || defender.stats.defense || 30)
    : (defender.stats.defense || 30);
  let dmg = (((2*lvl/5 + 2) * power * (atk/def)) / 50) + 2;
  if(attacker.types.includes(move.type)) dmg *= 1.5;
  const eff = typeMultiplier(move.type, defender.types);
  dmg *= eff;
  dmg *= 0.85 + Math.random()*0.15;
  return Math.max(1, Math.floor(dmg));
}

function hudBox(mon, isEnemy, isWild){
  const hpRatio = mon.hp / mon.maxHp;
  const hpClass = hpRatio < 0.25 ? 'low' : hpRatio < 0.5 ? 'mid' : '';
  return el('div', { class:'bs-info '+(isEnemy?'enemy':'player') }, [
    el('div', { class:'bsi-top' }, [
      el('span', { class:'bsi-name' }, (mon.nickname||mon.name).toUpperCase() + (mon.shiny?' ✦':'') + (mon._mega?' ◈':'') + (mon._dyna?(mon._gmax?' G◉':' ◉'):'')),
      el('span', { class:'bsi-lv' }, 'Lv.'+mon.level),
    ]),
    el('div', { class:'bsi-hp' }, [
      el('span', { class:'lbl' }, 'PS'),
      el('div', { class:'hp-bar '+hpClass }, [
        el('div', { class:'fill', style:{ width: Math.max(0, hpRatio*100)+'%' } })
      ]),
    ]),
    !isEnemy && el('div', { class:'bsi-hp-num mono' }, mon.hp+'/'+mon.maxHp),
    el('div', { class:'bsi-badges' }, [
      (mon.status && mon.status!=='none') && el('span', { class:'bsi-status', style:{ background: core.statusColor(mon.status) } }, core.statusShort(mon.status)),
      ...['attack','defense','special-attack','special-defense','speed']
        .map(k=>({k,s:(mon._stages?.[k]||0)})).filter(u=>u.s!==0)
        .map(u => el('span', { class:'bsi-stage '+(u.s>0?'up':'down') },
          (TYPE_LABEL_STAT[u.k]||u.k).replace(/^(o|a) /,'').slice(0,3).toUpperCase()+(u.s>0?'↑':'↓')+Math.abs(u.s))),
      isWild && isEnemy && el('span', { class:'bsi-wild mono' }, 'SELVAGEM'),
    ]),
  ]);
}

function mb(label, icon, onClick){
  return el('button', { class:'bs-mb', onClick }, [
    el('span', { class:'bs-mb-ic' }, icon),
    el('span', { class:'bs-mb-l' }, label),
  ]);
}
function bagItem(item, qty, onClick){
  return el('button', { class:'bs-bag-item', onClick }, [
    el('span', { class:'mono' }, item.name),
    el('span', { class:'mono small dim' }, '× '+qty),
  ]);
}
