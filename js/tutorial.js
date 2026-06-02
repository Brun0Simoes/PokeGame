/* ============================================================
   tutorial.js — first-run onboarding overlay (shown once)
   ============================================================ */

import { el, button } from './ui.js';
import { audio } from './audio.js';

const STEPS = [
  { icon:'🌿', title:'Bem-vindo, Treinador!', text:'Explore a região, encontre Pokémon na grama alta e capture-os com Pokébolas. Suba de nível enfrentando selvagens e treinadores.' },
  { icon:'⚔️', title:'Batalhas Completas', text:'Cada golpe tem tipo, eficácia e PP. A barrinha verde mostra golpes super eficazes. Use status, clima, terreno e troca de Pokémon a seu favor.' },
  { icon:'🧬', title:'Evolução & IVs', text:'Pokémon evoluem por nível, pedra, troca ou felicidade. Cada um tem IVs (potencial fixo) e EVs (treino via Vitaminas da Loja).' },
  { icon:'✦', title:'Poderes de Batalha', text:'Mega Evolução, Dynamax, Gigantamax e Movimentos Z estão disponíveis com os itens certos — acione na barra "PODER" do menu Lutar.' },
  { icon:'🏆', title:'Sua Jornada', text:'Vença 8 ginásios, a Elite 4 e o Campeão de cada região. Cumpra missões, suba no Ranking, desafie a Torre de Batalha e jogue na Liga Online!' },
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
    card.appendChild(el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ TUTORIAL · '+(i+1)+'/'+STEPS.length) ]));
    card.appendChild(el('div', { class:'tut-body' }, [
      el('div', { class:'tut-icon' }, s.icon),
      el('div', { class:'tut-title' }, s.title),
      el('div', { class:'tut-text' }, s.text),
      el('div', { class:'tut-dots' }, STEPS.map((_,k)=>el('span',{class:'tut-dot'+(k===i?' on':'')}))),
      el('div', { class:'tut-actions' }, [
        button({ label:'PULAR', kind:'ghost', onClick: finish }),
        button({ label: i<STEPS.length-1 ? 'PRÓXIMO ▸' : 'COMEÇAR ▸', kind:'primary', onClick: ()=>{ audio.playSfx('select'); if(i<STEPS.length-1){ i++; render(); } else finish(); } }),
      ]),
    ]));
  }
  function finish(){
    save.tutorialDone = true;
    ctx.saveAndSync && ctx.saveAndSync();
    backdrop.remove();
  }
}
