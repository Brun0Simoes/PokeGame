/* ============================================================
   tabs/trainers.js — NPC trainers in current region
   ============================================================ */

import { el, mount, button, toast } from '../ui.js';
import { audio } from '../audio.js';
import { npcsFor, TYPE_COLOR } from '../data.js';
import { runQuickBattle } from '../battle.js';
import { trainerSpriteTile } from '../trainer-sprite.js';
import { awardTrainerXp, TRAINER_XP } from '../trainer.js';

export function renderTrainers(root, ctx){
  const { save } = ctx;
  const trainers = npcsFor(save.trainer.region);
  let view = el('div', { class:'tab-page trainers-page' });
  mount(root, view);
  refresh();

  function refresh(){
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Treinadores · NPC'),
        el('p', { class:'page-sub' }, trainers.length
          ? `Há ${trainers.length} treinadores caminhando pela região. Derrote-os para ganhar EXP e Pokédollars.`
          : 'Esta região ainda não tem treinadores catalogados.'),
      ]),
      trainers.length === 0
        ? el('div', { class:'panel page-panel' }, [
            el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ SEM TREINADORES') ]),
            el('div', { class:'panel-body tight center' }, [
              el('div', { class:'empty-icon' }, [ el('div',{class:'pokeball'}) ]),
              el('p', { class:'dim' }, 'Tente viajar para outra região para encontrar treinadores.'),
            ]),
          ])
        : el('div', { class:'trainer-grid' },
            trainers.map(t => trainerCard(t, ctx, refresh))
          )
    );
  }
}

function trainerCard(t, ctx, refresh){
  const beaten = ctx.save.progress.trainersBeaten.includes(t.id);
  const reward = 100 + t.team.reduce((a,b)=>a+(b.lvl||5)*15, 0);
  return el('div', { class:'trainer-card panel'+(beaten?' beaten':'') }, [
    el('div', { class:'tc-avatar' }, [ trainerSpriteTile({ key: t.sprite, name: t.name, size: 76 }) ]),
    el('div', { class:'tc-body' }, [
      el('div', { class:'tc-class mono' }, t.class.toUpperCase()),
      el('div', { class:'tc-name' }, t.name),
      el('div', { class:'tc-team' }, t.team.map(m => el('span', { class:'mono tc-mon' }, '#' + String(m.id).padStart(3,'0') + ' Lv.' + m.lvl))),
      el('div', { class:'tc-reward mono' }, [
        el('span', { class:'dim' }, 'Recompensa: '), el('b',{}, '₽'+reward.toLocaleString('pt-BR')),
      ]),
    ]),
    el('div', { class:'tc-cta' }, [
      beaten
        ? el('span', { class:'badge-beat' }, '★ VENCIDO')
        : button({ label:'DESAFIAR ▸', kind:'primary', onClick: ()=>doBattle(t, ctx, refresh, reward) }),
    ]),
  ]);
}

async function doBattle(trainer, ctx, refresh, reward){
  if(ctx.save.party.filter(m=>m.hp>0).length === 0){
    toast('Sua equipe está nocauteada. Vá ao Centro Pokémon.', 'fail');
    audio.playSfx('error'); return;
  }
  audio.playSfx('open');
  const result = await runQuickBattle({
    ctx,
    opponentLabel: `${trainer.class} ${trainer.name}`,
    opponentTeam: trainer.team,
    sprite: trainer.sprite,
    musicMood: 'battle',
  });
  if(result === 'win'){
    ctx.save.progress.trainersBeaten.push(trainer.id);
    audio.playSfx('success');
    awardTrainerXp(ctx, TRAINER_XP.winNpc);
  }
  ctx.saveAndSync();
  refresh();
}
