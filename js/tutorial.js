/* ============================================================
   tutorial.js — first-run onboarding com 8 passos interativos
   PHASE 6: contextual + visual cues
   ============================================================ */

import { el, button } from './ui.js';
import { audio } from './audio.js';

const STEPS = [
  {
    icon: '🌿',
    title: 'Bem-vindo, Treinador!',
    text: 'Explore a região e encontre Pokémon na grama alta. Cada região tem dezenas de espécies diferentes.',
    highlight: '.sb-item[data-tab="wild"]',
    arrow: 'left',
  },
  {
    icon: '⚔️',
    title: 'Batalha em turnos',
    text: 'Use LUTAR para atacar com 4 golpes (cada um tem tipo, PP e poder). MOCHILA pra usar itens, POKÉMON pra trocar, FUGIR só em selvagens.',
    highlight: null,
    visual: 'battle-demo',
  },
  {
    icon: '🎯',
    title: 'Tipos e eficácia',
    text: 'Água > Fogo, Fogo > Grama, Grama > Água. Aproveite as fraquezas — golpes super eficazes causam 2× a 4× dano.',
    highlight: null,
    visual: 'type-chart',
  },
  {
    icon: '⚪',
    title: 'Capturando Pokémon',
    text: 'Enfraqueça o oponente (HP baixo) ou aplique status (sono, paralisia, congelamento) para aumentar a chance de captura. Master Ball sempre captura!',
    highlight: null,
    visual: 'capture-demo',
  },
  {
    icon: '🧬',
    title: 'Evolução & stats',
    text: 'Pokémon evoluem por nível, pedra, troca ou felicidade. Cada um tem IVs (0-31, potencial fixo) e EVs (até 252/stat, treino via Vitaminas).',
    highlight: '.sb-item[data-tab="team"]',
  },
  {
    icon: '✦',
    title: 'Poderes especiais',
    text: 'Mega Evolução, Dynamax, Gigantamax e Movimentos Z transformam o jogo. Compre os itens-chave na Loja e ative na barra "PODER" durante a batalha.',
    highlight: '.sb-item[data-tab="shop"]',
    visual: 'gimmicks',
  },
  {
    icon: '🏆',
    title: 'Conquiste a Liga',
    text: 'Vença os 8 Ginásios na ordem para destravar a Elite 4. Derrote os 4 + Campeão para entrar no Salão da Fama.',
    highlight: '.sb-item[data-tab="gyms"]',
  },
  {
    icon: '🌐',
    title: 'Jogue online',
    text: 'Conecte-se com outros treinadores na Liga Online, complete missões diárias, suba no Ranking e desafie a Torre de Batalha infinita!',
    highlight: '.sb-item[data-tab="online"]',
  },
];

export function maybeShowTutorial(save, ctx){
  if(save.tutorialDone) return;
  let i = 0;
  const backdrop = el('div', { class:'tut-backdrop' });
  const card = el('div', { class:'tut-card panel' });
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  audio.unlock && audio.unlock();
  render();

  function render(){
    const s = STEPS[i];
    card.innerHTML = '';
    // remove previous highlights
    document.querySelectorAll('.tut-highlighted').forEach(e => e.classList.remove('tut-highlighted'));
    // apply highlight if any
    if(s.highlight){
      const target = document.querySelector(s.highlight);
      if(target) target.classList.add('tut-highlighted');
    }
    card.appendChild(el('div', { class:'panel-bar' }, [
      el('span', { class:'dot' }),
      el('span', {}, '◢ TUTORIAL · '+(i+1)+'/'+STEPS.length),
      el('button', { class:'panel-bar-close', onClick: finish }, '✕'),
    ]));
    card.appendChild(el('div', { class:'tut-body' }, [
      el('div', { class:'tut-icon' }, s.icon),
      el('div', { class:'tut-title' }, s.title),
      el('div', { class:'tut-text' }, s.text),
      s.visual && el('div', { class:'tut-visual' }, renderVisual(s.visual)),
      el('div', { class:'tut-dots' }, STEPS.map((_,k)=>el('span', {
        class:'tut-dot'+(k===i?' on':''),
        onClick: ()=>{ i=k; render(); }
      }))),
      el('div', { class:'tut-actions' }, [
        button({ label: 'PULAR', kind:'ghost', onClick: finish }),
        i > 0 && button({ label:'◂ ANTERIOR', kind:'ghost', onClick: ()=>{ i--; audio.playSfx('select'); render(); } }),
        button({
          label: i<STEPS.length-1 ? 'PRÓXIMO ▸' : 'COMEÇAR ▸',
          kind: 'primary',
          onClick: ()=>{
            audio.playSfx('select');
            if(i<STEPS.length-1){ i++; render(); } else finish();
          },
        }),
      ]),
    ]));
  }

  function finish(){
    save.tutorialDone = true;
    ctx.saveAndSync && ctx.saveAndSync();
    document.querySelectorAll('.tut-highlighted').forEach(e => e.classList.remove('tut-highlighted'));
    backdrop.remove();
  }
}

/* ---- Mini-visuais interativos por step ---- */
function renderVisual(kind){
  if(kind === 'type-chart'){
    const chart = [
      { atk:'WATER', def:'FIRE',  eff:'2×', color:'#4F92DA' },
      { atk:'FIRE',  def:'GRASS', eff:'2×', color:'#E0492B' },
      { atk:'GRASS', def:'WATER', eff:'2×', color:'#7AC74C' },
      { atk:'WATER', def:'WATER', eff:'½×', color:'#4F92DA' },
    ];
    return el('div', { class:'tut-chart' }, chart.map(r => el('div', { class:'tut-chart-row' }, [
      el('span', { class:'type-chip t-'+r.atk.toLowerCase() }, r.atk),
      el('span', { class:'tut-arrow' }, '→'),
      el('span', { class:'type-chip t-'+r.def.toLowerCase() }, r.def),
      el('span', { class:'tut-eff', style:{ color: r.color } }, r.eff),
    ])));
  }
  if(kind === 'capture-demo'){
    return el('div', { class:'tut-capture' }, [
      el('div', { class:'tut-capture-row' }, [
        el('div', { class:'tut-hp-bar' }, [ el('div', { class:'tut-hp-fill low', style:{ width:'18%' } }) ]),
        el('span', {}, 'HP baixo = ✓'),
      ]),
      el('div', { class:'tut-capture-row' }, [
        el('span', { class:'tut-status', style:{ background:'#888' } }, 'SON'),
        el('span', {}, 'Sono/Congelado = 2.5×'),
      ]),
      el('div', { class:'tut-capture-row' }, [
        el('span', { class:'tut-status', style:{ background:'#F7D02C' } }, 'PAR'),
        el('span', {}, 'Status leve = 1.5×'),
      ]),
    ]);
  }
  if(kind === 'gimmicks'){
    return el('div', { class:'tut-gimmicks' }, [
      el('div', { class:'tut-gim mega' }, [ el('span', {}, '✦'), el('div', {}, 'MEGA') ]),
      el('div', { class:'tut-gim zmove' }, [ el('span', {}, 'Z'), el('div', {}, 'Z-MOVE') ]),
      el('div', { class:'tut-gim dyna' }, [ el('span', {}, '◉'), el('div', {}, 'DYNAMAX') ]),
    ]);
  }
  if(kind === 'battle-demo'){
    return el('div', { class:'tut-battle-demo' }, [
      el('div', { class:'tut-bd-buttons' }, [
        el('div', { class:'tut-bd-btn' }, '⚔ LUTAR'),
        el('div', { class:'tut-bd-btn' }, '🎒 MOCHILA'),
        el('div', { class:'tut-bd-btn' }, '◉ POKÉMON'),
        el('div', { class:'tut-bd-btn' }, '⤴ FUGIR'),
      ]),
    ]);
  }
  return null;
}
