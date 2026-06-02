/* ============================================================
   tabs/profile.js — trainer profile / status card
   ============================================================ */

import { el, mount, button } from '../ui.js';
import { audio } from '../audio.js';
import { REGIONS, gymsFor, elite4For, championFor, npcsFor } from '../data.js';
import { trainerExpProgress, MAX_TRAINER_LEVEL, encounterParamsFor } from '../trainer.js';
import { trainerSpriteTile } from '../trainer-sprite.js';

export function renderProfile(root, ctx){
  const { save, account } = ctx;
  const region = REGIONS.find(r => r.id === save.trainer.region);
  const view = el('div', { class:'tab-page profile-page' });
  mount(root, view);

  const prog = trainerExpProgress(save);
  const caught = Object.keys(save.pokedex.caught).length;
  const seen = Object.keys(save.pokedex.seen).length;
  const gyms = gymsFor(save.trainer.region);
  const gymsBeaten = gyms.filter(g => save.progress.gymsBeaten.includes(g.id)).length;
  const four = elite4For(save.trainer.region);
  const fourBeaten = four.filter(m => save.progress.trainersBeaten.includes(m.id)).length;
  const npcs = npcsFor(save.trainer.region);
  const npcsBeaten = npcs.filter(t => save.progress.trainersBeaten.includes(t.id)).length;
  const shinies = Object.values(save.pokedex.caught).filter(c => c.shiny).length;

  // totals across all regions
  let totalGyms = 0, totalGymsBeaten = 0;
  for(const r of REGIONS){
    const g = gymsFor(r.id);
    totalGyms += g.length;
    totalGymsBeaten += g.filter(x => save.progress.gymsBeaten.includes(x.id)).length;
  }

  const playtime = formatPlaytime(save.trainer.hoursPlayed || 0);
  const started = new Date(save.trainer.startedAt || Date.now());

  // rank title by trainer level
  const rank = rankTitle(save.trainer.level);

  mount(view,
    el('div', { class:'page-head' }, [
      el('h1', {}, 'Perfil do Treinador'),
      el('p', { class:'page-sub' }, 'Seu cartão de treinador, progresso e conquistas.'),
    ]),

    // Trainer card hero
    el('div', { class:'profile-card panel flush' }, [
      el('div', { class:'pf-banner', style:{ background:`linear-gradient(135deg, ${region?.color||'#2D5BD1'}, ${region?.accent||'#1A3A99'})` } }, [
        el('div', { class:'pf-avatar' }, [ trainerSpriteTile({ key:'red', name: save.trainer.name, size: 96, accent: region?.color }) ]),
        el('div', { class:'pf-id' }, [
          el('div', { class:'pf-name' }, save.trainer.name),
          el('div', { class:'pf-rank mono' }, rank),
          el('div', { class:'pf-meta mono' }, `ID ${String(save.trainer.id).padStart(5,'0')} · ${region?.name?.toUpperCase()||'—'}`),
        ]),
        el('div', { class:'pf-level' }, [
          el('div', { class:'pf-level-num' }, String(save.trainer.level)),
          el('div', { class:'pf-level-lbl mono' }, 'NÍVEL'),
        ]),
      ]),
      // EXP bar
      el('div', { class:'pf-exp' }, [
        el('div', { class:'pf-exp-head mono' }, [
          el('span', {}, 'EXP DE TREINADOR'),
          el('span', {}, prog.max ? 'NÍVEL MÁXIMO' : `${prog.into} / ${prog.span}`),
        ]),
        el('div', { class:'pf-exp-bar' }, [ el('div', { class:'fill', style:{ width:(prog.pct*100)+'%' } }) ]),
        el('div', { class:'pf-exp-sub mono' }, prog.max ? '★ Mestre Pokémon' : `Faltam ${prog.span - prog.into} EXP para o nível ${save.trainer.level+1}`),
      ]),
    ]),

    // Stat tiles
    el('div', { class:'pf-stats-grid' }, [
      statTile('₽', 'PokéDollars', save.trainer.money.toLocaleString('pt-BR'), '#F2B939'),
      statTile('◓', 'Capturados', caught, '#DC3545'),
      statTile('◎', 'Vistos', seen, '#2D5BD1'),
      statTile('✦', 'Shinies', shinies, '#B080FF'),
      statTile('⬡', 'Insígnias (região)', `${gymsBeaten}/${gyms.length}`, '#5FE17C'),
      statTile('⬡', 'Insígnias (total)', `${totalGymsBeaten}/${totalGyms}`, '#28A249'),
      statTile('⚔', 'Treinadores NPC', `${npcsBeaten}/${npcs.length}`, '#EE8130'),
      statTile('♛', 'Elite 4', `${fourBeaten}/${four.length}`, '#735797'),
      statTile('★', 'Campeão', save.progress.championBeaten ? 'SIM' : 'NÃO', '#F95587'),
      statTile('⏱', 'Tempo de jogo', playtime, '#79C9F2'),
      statTile('◈', 'Na equipe', `${save.party.length}/6`, '#6390F0'),
      statTile('▣', 'No PC', String(save.box.length), '#A8A77A'),
    ]),

    // Encounter forecast (moved from Wild tab) + achievements
    el('div', { class:'panel page-panel' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ ENCONTROS SELVAGENS') ]),
      el('div', { class:'panel-body wild-band' }, (()=>{
        const params = encounterParamsFor(save.trainer.level);
        return [
          encBand('NÍVEL SELVAGEM', `${params.levelMin}–${params.levelMax}`),
          encBand('EVOLUÇÃO', params.maxEvoStage === 0 ? 'formas base' : params.maxEvoStage === 1 ? 'até 2º estágio' : 'até final'),
          encBand('RARIDADE', params.rarityBias < 0.15 ? 'comum' : params.rarityBias < 0.35 ? 'incomum' : 'rara+'),
        ];
      })()),
    ]),

    // Achievements / milestones
    el('div', { class:'panel page-panel' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ CONQUISTAS') ]),
      el('div', { class:'panel-body' }, [
        el('div', { class:'pf-achievements' }, achievements(save, { caught, gymsBeaten, shinies, totalGymsBeaten }).map(a =>
          el('div', { class:'pf-achv'+(a.done?' done':'') }, [
            el('span', { class:'pf-achv-ic' }, a.done ? '✓' : '○'),
            el('div', {}, [
              el('div', { class:'pf-achv-name' }, a.name),
              el('div', { class:'pf-achv-desc dim' }, a.desc),
            ]),
          ]))),
      ]),
    ]),

    // Footer info
    el('div', { class:'panel page-panel' }, [
      el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ CONTA') ]),
      el('div', { class:'panel-body' }, [
        infoLine('E-mail', account.email),
        infoLine('Início da jornada', started.toLocaleDateString('pt-BR')),
        infoLine('Região natal', (REGIONS.find(r=>r.id===account.regionId)?.name) || '—'),
        el('div', { class:'row gap', style:{marginTop:'12px'} }, [
          button({ label:'EDITAR EQUIPE ▸', kind:'blue', onClick:()=>ctx.go('/game/team') }),
          button({ label:'VER POKÉDEX ▸', kind:'ghost', onClick:()=>ctx.go('/game/pokedex') }),
        ]),
      ]),
    ]),
  );
}

function statTile(icon, label, value, color){
  return el('div', { class:'pf-stat-tile', style:{ '--tile-color': color } }, [
    el('div', { class:'pf-stat-ic', style:{ color } }, icon),
    el('div', { class:'pf-stat-val' }, String(value)),
    el('div', { class:'pf-stat-lbl' }, label),
  ]);
}
function encBand(label, value){
  return el('div', { class:'wild-band-stat' }, [
    el('div', { class:'mono wb-l' }, label),
    el('div', { class:'mono wb-v' }, value),
  ]);
}
function infoLine(k, v){
  return el('div', { class:'pf-info-line' }, [
    el('span', { class:'mono', style:{fontSize:'9px',color:'var(--ink-soft)'} }, k.toUpperCase()),
    el('span', { class:'mono', style:{fontSize:'11px'} }, String(v)),
  ]);
}
function formatPlaytime(hours){
  const totalMin = Math.floor((hours||0)*60);
  const h = Math.floor(totalMin/60);
  const m = totalMin%60;
  return `${h}h ${String(m).padStart(2,'0')}m`;
}
function rankTitle(level){
  if(level >= MAX_TRAINER_LEVEL) return 'MESTRE POKÉMON';
  if(level >= 40) return 'TREINADOR LENDÁRIO';
  if(level >= 30) return 'ÁS TREINADOR';
  if(level >= 20) return 'VETERANO';
  if(level >= 12) return 'TREINADOR EXPERIENTE';
  if(level >= 6)  return 'TREINADOR';
  return 'NOVATO';
}
function achievements(save, s){
  return [
    { name:'Primeiros Passos', desc:'Capture seu primeiro Pokémon', done: s.caught >= 1 },
    { name:'Colecionador', desc:'Capture 10 Pokémon', done: s.caught >= 10 },
    { name:'Pokédex em Progresso', desc:'Capture 30 Pokémon', done: s.caught >= 30 },
    { name:'Caçador Shiny', desc:'Capture um Pokémon shiny', done: s.shinies >= 1 },
    { name:'Primeira Insígnia', desc:'Vença um líder de ginásio', done: s.gymsBeaten >= 1 },
    { name:'Conquistador Regional', desc:'Vença os 8 ginásios de uma região', done: s.gymsBeaten >= 8 },
    { name:'Campeão', desc:'Torne-se Campeão de uma região', done: !!save.progress.championBeaten },
    { name:'Andarilho', desc:'Vença ginásios em várias regiões', done: s.totalGymsBeaten >= 16 },
  ];
}
