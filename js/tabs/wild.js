/* ============================================================
   tabs/wild.js — Wild Encounter (mainline-style)
   3 sighted Pokémon in tall grass; choose one → battle.
   Encounter level / evolution / rarity scale with trainer level.
   ============================================================ */

import { el, mount, button, toast, typeChip } from '../ui.js';
import { audio } from '../audio.js';
import { api } from '../api.js';
import { REGIONS, TYPE_COLOR } from '../data.js';
import { startWildBattle } from '../battle.js';
import { openAR } from '../ar.js';
import { ensureTrainerProgress, encounterParamsFor, awardTrainerXp, TRAINER_XP } from '../trainer.js';

export function renderWild(root, ctx){
  const { save } = ctx;
  ensureTrainerProgress(save);
  const region = REGIONS.find(r => r.id === save.trainer.region);

  let sightings = [];   // { pokemon, level, sprite }
  let loading = false;

  const view = el('div', { class:'tab-page wild-page-v2' });
  mount(root, view);
  refresh();

  async function generate(){
    if(loading) return;
    loading = true;
    sightings = [];
    refresh();
    audio.playSfx('scan');
    try{
      const params = encounterParamsFor(save.trainer.level);
      const picks = await Promise.all(
        Array.from({length:3}, async ()=>{
          let p = await api.getRandomEncounter({ regionId: region?.id, rarityBias: params.rarityBias });
          if(p && params.maxEvoStage > 0){
            p = await api.getEvolvedForm(p, params.maxEvoStage);
          }
          return p;
        })
      );
      sightings = picks.filter(Boolean).map(p => ({
        pokemon: p,
        level: params.levelMin + Math.floor(Math.random() * (params.levelMax - params.levelMin + 1)),
        sprite: api.getBestSprite(p, 'showdown', false) || api.getBestSprite(p, 'front', false),
      }));
      audio.playSfx('spawn');
      import('../quests.js').then(q=>q.questEvent(save, 'encounter', sightings.length));
      let changed = false;
      for(const s of sightings){
        if(!save.pokedex.seen[s.pokemon.id]){
          save.pokedex.seen[s.pokemon.id] = {
            name: s.pokemon.name,
            types: s.pokemon.types.map(t=>t.type.name),
            sprite: s.sprite,
            at: Date.now(),
          };
          changed = true;
        }
      }
      if(changed) ctx.saveAndSync();
    }catch(err){
      console.warn(err);
      toast('Falha ao buscar Pokémon — tente novamente.', 'fail');
    }
    loading = false;
    refresh();
  }

  async function choose(sighting){
    audio.playSfx('select');
    const result = await startWildBattle({
      ctx,
      wildPokemon: sighting.pokemon,
      level: sighting.level,
    });
    sightings = sightings.filter(s => s !== sighting);
    // Trainer XP rewards
    if(result === 'caught'){
      awardTrainerXp(ctx, TRAINER_XP.catch);
      ctx.toast(`${sighting.pokemon.name.toUpperCase()} foi capturado! +${TRAINER_XP.catch} XP de treinador`, 'success');
    } else if(result === 'ko'){
      awardTrainerXp(ctx, TRAINER_XP.winWild);
      ctx.toast(`${sighting.pokemon.name.toUpperCase()} foi nocauteado.`, 'info');
    } else if(result === 'flee_player' || result === 'flee_wild'){
      ctx.toast(result === 'flee_player' ? 'Você fugiu!' : 'O Pokémon fugiu!', 'info');
    }
    refresh();
  }

  function refresh(){
    const params = encounterParamsFor(save.trainer.level);
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, '🌿 Grama Alta'),
        el('p', { class:'page-sub' },
          `Você está explorando a região de ${region?.name || '???'}. ` +
          (sightings.length
            ? 'Três Pokémon apareceram. Qual você vai enfrentar?'
            : 'Pressione "Procurar na grama" para encontrar Pokémon selvagens da região.')),
      ]),

      legendBanner(),

      // Grass scene
      el('div', { class:'grass-scene panel page-panel flush' }, [
        el('div', { class:'gs-sky' }),
        el('div', { class:'gs-hills' }),
        el('div', { class:'gs-grass-bg' }),
        loading
          ? el('div', { class:'gs-loading' }, [
              el('div', { class:'pokeball-spinner small' }),
              el('div', { class:'mono', style:{fontSize:'11px',letterSpacing:'.08em'} }, 'PROCURANDO NA GRAMA…'),
              el('div', { class:'mono dim', style:{fontSize:'9px',marginTop:'6px'} }, 'Aguarde alguns instantes.'),
            ])
          : sightings.length === 0
            ? el('div', { class:'gs-empty' }, [
                el('p', { class:'dialog-msg center', html:
                  'Você caminha pela <b>grama alta</b>… Pressione o botão abaixo para procurar Pokémon selvagens!' }),
                el('div', { class:'gs-grass' }, [grassClump(), grassClump(), grassClump(), grassClump(), grassClump()]),
              ])
            : el('div', { class:'gs-sightings' }, sightings.map(s => sightingCard(s))),
      ]),

      // Actions
      el('div', { class:'wild-actions panel page-panel' }, [
        el('div', { class:'row gap' }, [
          button({ label: loading ? 'PROCURANDO…' : (sightings.length ? 'PROCURAR DE NOVO' : 'PROCURAR NA GRAMA ▸'),
                   kind: 'primary', disabled: loading, onClick: generate }),
          sightings.length > 0 && button({ label:'IGNORAR E SAIR', kind:'ghost', onClick: ()=>{ sightings=[]; audio.playSfx('cancel'); refresh(); } }),
        ]),
        el('p', { class:'dim small', style:{marginTop:'8px'} },
          'Suba de nível de treinador vencendo batalhas e capturando Pokémon — assim aparecem selvagens mais fortes, evoluídos e raros.'),
        sightings.length > 0 && el('div', { class:'ar-tip mono' }, '📱 Toque em “AR / 3D” num Pokémon para vê-lo no ambiente real (WebXR) ou no palco 3D.'),
      ]),
    );
  }

  function legendBanner(){
    const LEGENDS = [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,480,481,482,483,484,485,487,488,491,638,639,640,643,644,646,716,717,718,785,786,787,788,791,792,800,888,889,890];
    const week = Math.floor(Date.now() / (7*24*3600*1000));
    const legendId = LEGENDS[week % LEGENDS.length];
    const claimed = save.legendClaimed === week;
    return el('div', { class:'legend-banner' }, [
      el('div', { class:'lb-inner' }, [
        el('div', { class:'legend-art' }, [
          el('img', { src:`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${legendId}.png`, alt:'lendário' }),
        ]),
        el('div', { style:{flex:'1'} }, [
          el('div', { class:'legend-title' }, '✨ ENCONTRO LENDÁRIO DA SEMANA'),
          el('div', { class:'legend-sub' }, claimed
            ? 'Você já enfrentou o lendário desta semana. Volte na próxima!'
            : 'Um Pokémon lendário apareceu! Ele é forte — prepare suas melhores Pokébolas.'),
          el('div', { class:'legend-meta' }, 'Renova toda semana · #'+String(legendId).padStart(3,'0')),
        ]),
        !claimed && button({ label:'ENFRENTAR ▸', kind:'primary', onClick:()=>challengeLegend(legendId, week) }),
      ]),
    ]);
  }
  async function challengeLegend(id, week){
    audio.playSfx('scan');
    const p = await api.getPokemon(id);
    if(!p){ toast('Falha ao invocar o lendário.', 'fail'); return; }
    const lvl = Math.min(80, 50 + Math.floor((save.trainer.level||1)/2));
    save.legendClaimed = week;
    ctx.saveAndSync();
    const result = await startWildBattle({ ctx, wildPokemon:p, level:lvl });
    refresh();
    if(result === 'caught') toast(`INCRÍVEL! Você capturou ${p.name.toUpperCase()}!`, 'success');
  }

  function sightingCard(sighting){
    const { pokemon: p, level, sprite } = sighting;
    const types = p.types.map(t=>t.type.name);
    const accent = TYPE_COLOR[types[0]] || '#888';
    const caught = !!save.pokedex.caught[p.id];
    return el('div', { class:'sighting-card' }, [
      el('div', { class:'sc-grass' }, grassPx()),
      el('div', { class:'sc-art', style:{ background:`radial-gradient(ellipse at 50% 90%, ${accent}33, transparent 70%)` } }, [
        el('img', { src: sprite, alt: p.name, style:{ imageRendering:'pixelated' } }),
      ]),
      el('div', { class:'sc-info' }, [
        el('div', { class:'sc-name' }, [
          el('span', {}, (p.name || '?').toUpperCase()),
          caught && el('span', { class:'sc-caught', title:'Já capturou' }, '★'),
        ]),
        el('div', { class:'sc-lvl mono' }, 'Lv. ' + level),
        el('div', { class:'sc-types' }, types.map(t => typeChip(t))),
      ]),
      el('div', { class:'sc-actions' }, [
        el('button', { class:'sc-cta mono', onClick: ()=>choose(sighting) }, 'BATALHAR ▸'),
        el('button', { class:'sc-ar mono', onClick: ()=>openAR({ pokemon:p, level, ctx, onCaptured:()=>{ sightings = sightings.filter(s=>s!==sighting); refresh(); } }) }, '📱 AR / 3D'),
      ]),
    ]);
  }

  return () => {};
}

function grassClump(){
  return el('div', { class:'grass-clump' }, grassPx());
}
function grassPx(){
  return el('span', { html: `
    <svg viewBox="0 0 24 12" width="60" height="30" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="8" width="24" height="4" fill="#3F7A28"/>
      <rect x="1" y="6" width="2" height="6" fill="#4F9E3D"/>
      <rect x="5" y="4" width="2" height="8" fill="#7AC74C"/>
      <rect x="9" y="2" width="2" height="10" fill="#4F9E3D"/>
      <rect x="13" y="4" width="2" height="8" fill="#7AC74C"/>
      <rect x="17" y="6" width="2" height="6" fill="#4F9E3D"/>
      <rect x="21" y="3" width="2" height="9" fill="#7AC74C"/>
    </svg>` });
}
