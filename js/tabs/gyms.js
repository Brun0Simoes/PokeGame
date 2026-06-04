/* ============================================================
   tabs/gyms.js — 8 gym leaders per region
   ============================================================ */

import { el, mount, button, toast } from '../ui.js';
import { audio } from '../audio.js';
import { gymsFor } from '../data.js';
import { runQuickBattle } from '../battle.js';
import { trainerSpriteTile } from '../trainer-sprite.js';
import { awardTrainerXp, TRAINER_XP } from '../trainer.js';

export function renderGyms(root, ctx){
  const { save } = ctx;
  const gyms = gymsFor(save.trainer.region);
  let view = el('div', { class:'tab-page gyms-page' });
  mount(root, view);
  refresh();

  function refresh(){
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Ginásios da Região'),
        el('p', { class:'page-sub' }, gyms.length
          ? `${countBeaten(gyms, save)}/${gyms.length} insígnias conquistadas. Vença na ordem para liberar o próximo.`
          : 'Esta região ainda não tem ginásios catalogados.'),
      ]),
      gyms.length === 0
        ? el('div', { class:'panel page-panel' }, [
            el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ EM CONSTRUÇÃO') ]),
            el('div', { class:'panel-body tight' }, [
              el('p', { class:'dim' }, 'Tente viajar para outra região.'),
            ]),
          ])
        : el('div', { class:'gym-list' }, gyms.map((g,i) => gymCard(g, i, gyms, ctx, refresh)))
    );
  }
}

function countBeaten(gyms, save){
  return gyms.filter(g => save.progress.gymsBeaten.includes(g.id)).length;
}

function gymCard(gym, idx, allGyms, ctx, refresh){
  const beaten = ctx.save.progress.gymsBeaten.includes(gym.id);
  const locked = idx > 0 ? !ctx.save.progress.gymsBeaten.includes(allGyms[idx-1].id) : false;
  const reward = 800 + idx*400;
  return el('div', { class:'gym-card panel'+(beaten?' beaten':'')+(locked?' locked':'') }, [
    el('div', { class:'gc-portrait' }, [ trainerSpriteTile({ key: gym.sprite, name: gym.leader, size: 88, accent: gym.badge.color }) ]),
    el('div', { class:'gc-badge', style:{ background: gym.badge.color } }, [ badgeSvg(gym.type, gym.badge.name) ]),
    el('div', { class:'gc-body' }, [
      el('div', { class:'gc-meta' }, [
        el('span', { class:'mono gc-num' }, `GINÁSIO #${idx+1}`),
        el('span', { class:'gc-type type-chip t-'+gym.type }, gym.type),
      ]),
      el('div', { class:'gc-title' }, gym.leader),
      el('div', { class:'gc-city dim mono' }, gym.city),
      el('div', { class:'gc-team' }, gym.team.map(m =>
        el('span', { class:'mono gc-mon' }, `#${String(m.id).padStart(3,'0')} Lv.${m.lvl}`))),
      el('div', { class:'gc-row' }, [
        el('span', { class:'mono dim small' }, `Limite Lv. ${gym.levelCap} · Recompensa: ₽${reward.toLocaleString('pt-BR')} + Insígnia ${gym.badge.name}`),
      ]),
    ]),
    el('div', { class:'gc-cta' }, [
      beaten
        ? el('span', { class:'badge-beat' }, '★ INSÍGNIA CONQUISTADA')
        : locked
          ? el('span', { class:'gc-locked mono' }, '🔒 BLOQUEADO')
          : button({ label:'DESAFIAR LÍDER ▸', kind:'primary', onClick:()=>doGymBattle(gym, idx, ctx, refresh, reward) }),
    ]),
  ]);
}

async function doGymBattle(gym, idx, ctx, refresh, reward){
  if(ctx.save.party.filter(m=>m.hp>0).length === 0){
    toast('Equipe nocauteada — visite o Centro Pokémon.', 'fail'); audio.playSfx('error'); return;
  }
  const result = await runQuickBattle({
    ctx,
    opponentLabel: `LÍDER ${gym.leader}`,
    opponentTeam: gym.team,
    sprite: gym.sprite,
    musicMood: 'gym',
  });
  if(result === 'win'){
    ctx.save.progress.gymsBeaten.push(gym.id);
    audio.playSfx('badge');
    awardTrainerXp(ctx, TRAINER_XP.winGym);
    import('../quests.js').then(q=>{ q.questEvent(ctx.save, 'gym'); q.questEvent(ctx.save, 'win'); ctx.saveAndSync(); });
    toast(`Insígnia ${gym.badge.name} conquistada!`, 'success');
  }
  ctx.saveAndSync();
  refresh();
}

/* ---- VISUAL FIX V9: badges variadas por tipo (em vez de estrela genérica) ---- */
const BADGE_SHAPES = {
  // tipo: forma SVG
  rock:     '<polygon points="16,2 26,8 26,24 16,30 6,24 6,8" />',
  water:    '<path d="M16 4 C20 14 26 18 26 23 A10 10 0 0 1 6 23 C6 18 12 14 16 4 Z" />',
  electric: '<polygon points="20,2 8,17 15,18 12,30 25,13 18,12 22,2" />',
  grass:    '<path d="M16 28 C8 24 4 18 6 10 C10 12 14 14 16 18 C18 14 22 12 26 10 C28 18 24 24 16 28 Z" />',
  poison:   '<path d="M16 4 C22 12 26 18 26 22 A10 10 0 0 1 6 22 C6 18 10 12 16 4 Z M10 22 L22 22 M14 26 L18 26" />',
  psychic:  '<circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="6" fill="white"/><circle cx="16" cy="16" r="2"/>',
  fire:     '<path d="M16 3 C12 9 14 13 12 17 C10 20 11 24 14 26 C12 22 16 19 17 22 C18 20 22 22 22 26 C25 22 23 17 19 15 C21 11 17 7 16 3 Z" />',
  ground:   '<polygon points="2,28 16,4 30,28" /><polygon points="10,28 16,16 22,28" fill="white" />',
  ice:      '<g stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="16" y1="3" x2="16" y2="29"/><line x1="4" y1="9" x2="28" y2="23"/><line x1="4" y1="23" x2="28" y2="9"/></g>',
  flying:   '<path d="M2 18 Q10 6 16 12 Q22 6 30 18 Q22 16 16 22 Q10 16 2 18 Z" />',
  fighting: '<rect x="8" y="12" width="16" height="14" rx="3" /><rect x="6" y="14" width="6" height="10" rx="2" /><rect x="20" y="14" width="6" height="10" rx="2" />',
  bug:      '<polygon points="16,3 28,11 28,21 16,29 4,21 4,11" /><circle cx="12" cy="16" r="2" fill="white"/><circle cx="20" cy="16" r="2" fill="white"/>',
  dragon:   '<path d="M4 16 C8 8 16 6 22 10 L28 14 L24 16 L28 20 L22 22 C16 26 8 24 4 16 Z" />',
  ghost:    '<path d="M6 14 C6 8 10 4 16 4 C22 4 26 8 26 14 V26 L22 24 L18 27 L14 24 L10 27 L6 26 Z" /><circle cx="13" cy="14" r="1.5" fill="white"/><circle cx="19" cy="14" r="1.5" fill="white"/>',
  dark:     '<path d="M22 4 A12 12 0 1 0 22 28 A10 10 0 1 1 22 4 Z" />',
  steel:    '<polygon points="16,3 21,7 28,8 27,15 30,21 24,24 22,30 16,28 10,30 8,24 2,21 5,15 4,8 11,7" /><circle cx="16" cy="16" r="4" fill="white"/>',
  fairy:    '<polygon points="16,2 19,12 30,12 21,19 24,30 16,23 8,30 11,19 2,12 13,12" />',
  normal:   '<path d="M16 28 C2 18 4 6 12 6 C14 6 16 8 16 10 C16 8 18 6 20 6 C28 6 30 18 16 28 Z" />',
};

function badgeSvg(type, _name){
  const shape = BADGE_SHAPES[type] || BADGE_SHAPES.normal;
  const div = document.createElement('div');
  div.innerHTML = `<svg viewBox="0 0 32 32" width="100%" height="100%" stroke="#1B2154" stroke-width="2" stroke-linejoin="round" fill="currentColor">${shape}</svg>`;
  div.style.color = '#fff';
  div.style.filter = 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))';
  return div;
}
