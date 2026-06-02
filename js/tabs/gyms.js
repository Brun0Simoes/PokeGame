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
    el('div', { class:'gc-badge', style:{ background: gym.badge.color } }, [ badgeSvg() ]),
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

function badgeSvg(){
  const div = document.createElement('div');
  div.innerHTML = `<svg viewBox="0 0 32 32" width="100%" height="100%"><polygon points="16,3 19,11 28,12 21,18 23,28 16,23 9,28 11,18 4,12 13,11" fill="currentColor" stroke="#1B2154" stroke-width="2" stroke-linejoin="round"/></svg>`;
  div.style.color = 'inherit';
  return div;
}
