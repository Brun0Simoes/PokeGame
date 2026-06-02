/* ============================================================
   tabs/elite.js — Elite 4 + Champion (per region)
   ============================================================ */

import { el, mount, button, toast } from '../ui.js';
import { audio } from '../audio.js';
import { elite4For, championFor, gymsFor } from '../data.js';
import { runQuickBattle } from '../battle.js';
import { trainerSpriteTile } from '../trainer-sprite.js';
import { awardTrainerXp, TRAINER_XP } from '../trainer.js';

export function renderElite(root, ctx){
  const { save } = ctx;
  const four = elite4For(save.trainer.region);
  const champion = championFor(save.trainer.region);
  const gyms = gymsFor(save.trainer.region);
  const gymsBeaten = gyms.filter(g => save.progress.gymsBeaten.includes(g.id)).length;
  const allGyms = gyms.length;
  const unlocked = allGyms > 0 && gymsBeaten >= allGyms;

  const view = el('div', { class:'tab-page elite-page' });
  mount(root, view);
  refresh();

  function refresh(){
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Elite 4 & Campeão'),
        el('p', { class:'page-sub' }, unlocked
          ? 'Você conquistou todas as insígnias. A Liga aguarda!'
          : `Você precisa de todas as ${allGyms||8} insígnias para desafiar a Liga. Você tem ${gymsBeaten}.`),
      ]),
      !unlocked
        ? el('div', { class:'panel page-panel locked-banner' }, [
            el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ LIGA BLOQUEADA') ]),
            el('div', { class:'panel-body tight' }, [
              el('div', { class:'lb-row' }, [
                el('div', { class:'lb-pad' }, '🔒'),
                el('div', {}, [
                  el('p', { class:'dialog-msg' }, `Conquiste todas as insígnias da região. Restam <b>${Math.max(0, allGyms - gymsBeaten)}</b>.`),
                  button({ label:'IR PARA GINÁSIOS ▸', kind:'primary', onClick:()=>ctx.go('/game/gyms') }),
                ]),
              ]),
            ]),
          ])
        : null,
      four.length === 0
        ? el('div', { class:'panel page-panel' }, [
            el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ EM BREVE') ]),
            el('div', { class:'panel-body tight' }, [
              el('p', { class:'dim' }, 'A Elite 4 desta região ainda não está catalogada.'),
            ]),
          ])
        : el('div', { class:'elite-list' }, [
            ...four.map((m,i) => eliteCard(m, i, four, ctx, refresh, unlocked)),
            champion && championCard(champion, ctx, refresh, unlocked && allFourBeaten(four, save)),
          ])
    );
  }
}

function allFourBeaten(four, save){
  return four.every(m => save.progress.trainersBeaten.includes(m.id));
}

function eliteCard(member, idx, four, ctx, refresh, available){
  const beaten = ctx.save.progress.trainersBeaten.includes(member.id);
  const locked = !available || (idx > 0 && !ctx.save.progress.trainersBeaten.includes(four[idx-1].id));
  const reward = 3000 + idx*1000;
  return el('div', { class:'elite-card panel'+(beaten?' beaten':'')+(locked?' locked':'') }, [
    el('div', { class:'ec-num mono' }, '#0'+(idx+1)),
    el('div', { class:'ec-portrait' }, [ trainerSpriteTile({ key: member.sprite, name: member.name, size: 78 }) ]),
    el('div', { class:'ec-body' }, [
      el('div', { class:'ec-title' }, member.name),
      el('div', { class:'ec-type type-chip t-'+member.type }, member.type),
      el('div', { class:'ec-team' }, member.team.map(m =>
        el('span', { class:'mono ec-mon' }, `#${String(m.id).padStart(3,'0')} Lv.${m.lvl}`))),
      el('div', { class:'mono dim small' }, `Recompensa: ₽${reward.toLocaleString('pt-BR')}`),
    ]),
    el('div', { class:'ec-cta' }, [
      beaten
        ? el('span', { class:'badge-beat' }, '★ VENCIDO')
        : locked
          ? el('span', { class:'gc-locked mono' }, '🔒 BLOQUEADO')
          : button({ label:'DESAFIAR ▸', kind:'primary', onClick:()=>doFight(member, ctx, refresh, reward, idx) }),
    ]),
  ]);
}

function championCard(champ, ctx, refresh, available){
  const beaten = ctx.save.progress.championBeaten;
  const reward = 20000;
  return el('div', { class:'champion-card panel'+(beaten?' beaten':'')+(!available?' locked':'') }, [
    el('div', { class:'cc-strap' }, [ el('span', {}, '◤ CAMPEÃO DA REGIÃO ◢') ]),
    el('div', { class:'cc-body' }, [
      el('div', { class:'cc-portrait' }, [ trainerSpriteTile({ key: champ.sprite, name: champ.name, size: 120, accent:'#F2B939' }) ]),
      el('div', { class:'cc-meta' }, [
        el('div', { class:'cc-title' }, champ.name),
        el('div', { class:'cc-team' }, champ.team.map(m =>
          el('span', { class:'mono cc-mon' }, `#${String(m.id).padStart(3,'0')} Lv.${m.lvl}`))),
        el('div', { class:'mono dim small' }, `Recompensa: ₽${reward.toLocaleString('pt-BR')} · Salão da Fama!`),
        el('div', { class:'cc-cta' }, [
          beaten
            ? el('div', { class:'mono', style:{ color:'#FFD24E', fontSize:'14px' } }, '★ CAMPEÃO ETERNO')
            : !available
              ? el('span', { class:'gc-locked mono' }, '🔒 VENÇA A ELITE 4')
              : button({ label:'DESAFIAR CAMPEÃO ▸', kind:'primary', onClick:()=>doFightChampion(champ, ctx, refresh, reward) }),
        ]),
      ]),
    ]),
  ]);
}

async function doFight(member, ctx, refresh, reward, idx){
  if(ctx.save.party.filter(m=>m.hp>0).length === 0){
    toast('Equipe nocauteada — visite o Centro Pokémon.', 'fail'); audio.playSfx('error'); return;
  }
  const result = await runQuickBattle({
    ctx,
    opponentLabel: `ELITE 4 · ${member.name}`,
    opponentTeam: member.team,
    sprite: member.sprite,
    musicMood: 'gym',
  });
  if(result === 'win'){
    ctx.save.progress.trainersBeaten.push(member.id);
    awardTrainerXp(ctx, TRAINER_XP.winElite);
    const four = elite4For(ctx.save.trainer.region);
    if(four.every(m => ctx.save.progress.trainersBeaten.includes(m.id))){
      ctx.save.progress.elite4Cleared = true;
      toast('Elite 4 dominada! Hora do Campeão.', 'success');
    }
    audio.playSfx('badge');
  }
  ctx.saveAndSync();
  refresh();
}

async function doFightChampion(champ, ctx, refresh, reward){
  if(ctx.save.party.filter(m=>m.hp>0).length === 0){
    toast('Equipe nocauteada — visite o Centro Pokémon.', 'fail'); audio.playSfx('error'); return;
  }
  const result = await runQuickBattle({
    ctx,
    opponentLabel: `CAMPEÃO · ${champ.name}`,
    opponentTeam: champ.team,
    sprite: champ.sprite,
    musicMood: 'gym',
  });
  if(result === 'win'){
    ctx.save.progress.championBeaten = true;
    audio.playSfx('success');
    awardTrainerXp(ctx, TRAINER_XP.winChampion);
    toast('Você é o novo Campeão! Bem-vindo ao Salão da Fama!', 'success');
  }
  ctx.saveAndSync();
  refresh();
}
