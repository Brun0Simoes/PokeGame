/* ============================================================
   tabs/travel.js — change current region.
   Picks region and resets local NPC/Gym/Elite progress for that region.
   Progress in other regions is preserved.
   ============================================================ */

import { el, mount, button, toast, confirmModal } from '../ui.js';
import { audio } from '../audio.js';
import { REGIONS, gymsFor, elite4For, championFor, npcsFor } from '../data.js';

export function renderTravel(root, ctx){
  const { save } = ctx;
  const view = el('div', { class:'tab-page travel-page' });
  mount(root, view);
  refresh();

  function refresh(){
    const currentRegion = REGIONS.find(r => r.id === save.trainer.region);
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Viajar entre Regiões'),
        el('p', { class:'page-sub' },
          'Pegue o navio, o trem ou o avião. Cada região tem treinadores, líderes de ginásio, ' +
          'Elite 4 e Campeão próprios. Seu progresso em cada região é salvo separadamente.'),
      ]),

      // Current region card
      el('div', { class:'panel page-panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ VOCÊ ESTÁ EM') ]),
        el('div', { class:'panel-body' }, [
          currentRegion ? regionSummary(currentRegion, save, true) : el('p', {}, 'Região desconhecida.'),
        ]),
      ]),

      // Region picker
      el('div', { class:'panel page-panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ OUTRAS REGIÕES'), el('span', { class:'right mono', style:{fontSize:'8px'} }, `${REGIONS.length} disponíveis`) ]),
        el('div', { class:'panel-body' }, [
          el('div', { class:'region-grid' },
            REGIONS.filter(r => r.id !== save.trainer.region).map(r => regionTravelCard(r, save, async ()=>{
              audio.playSfx('select');
              const ok = await confirmModal({
                title: 'CONFIRMAR VIAGEM',
                message: `Viajar para <b>${r.name}</b>? Você vai começar lá com 0 insígnias. Seu progresso em <b>${currentRegion?.name||'???'}</b> continua salvo.`,
                confirmLabel: 'VIAJAR',
                cancelLabel: 'CANCELAR',
              });
              if(ok){
                travelTo(ctx, r.id);
                refresh();
                ctx.toast(`Bem-vindo à região de ${r.name}!`, 'success');
              }
            }))
          ),
        ]),
      ]),
    );
  }
}

function regionSummary(region, save, isCurrent){
  const gyms = gymsFor(region.id);
  const four = elite4For(region.id);
  const champ = championFor(region.id);
  const npcs = npcsFor(region.id);
  const gymsBeaten = gyms.filter(g=>save.progress.gymsBeaten.includes(g.id)).length;
  const fourBeaten = four.filter(m=>save.progress.trainersBeaten.includes(m.id)).length;

  return el('div', { class:'region-summary' }, [
    el('div', { class:'rs-flag', style:{ background:`linear-gradient(180deg, ${region.color}, ${region.accent})` } }, [
      el('span', { class:'mono rs-gen', style:{ color: region.color } }, 'GEN '+region.gen),
      el('span', { class:'mono rs-name' }, region.name.toUpperCase()),
    ]),
    el('div', { class:'rs-body' }, [
      el('p', { class:'rs-motto' }, region.motto),
      el('div', { class:'rs-stats' }, [
        rsStat('GINÁSIOS', `${gymsBeaten}/${gyms.length}`, region.color),
        rsStat('ELITE 4',  `${fourBeaten}/${four.length}`, region.color),
        rsStat('CAMPEÃO',  save.progress.championBeaten && isCurrent ? '★' : (champ?'1':'0'), region.color),
        rsStat('NPCs',     npcs.length, region.color),
      ]),
    ]),
  ]);
}
function rsStat(lbl, v, color){
  return el('div', { class:'rs-stat', style:{ borderColor: color } }, [
    el('div', { class:'mono rs-stat-l' }, lbl),
    el('div', { class:'mono rs-stat-v' }, String(v)),
  ]);
}

function regionTravelCard(r, save, onTravel){
  const gyms = gymsFor(r.id);
  const four = elite4For(r.id);
  return el('button', {
    class:'travel-card',
    onClick: onTravel,
  }, [
    el('div', { class:'tv-flag', style:{ background:`linear-gradient(180deg, ${r.color}, ${r.accent})` } }, [
      el('span', { class:'mono tv-gen', style:{ color:r.color } }, 'GEN '+r.gen),
      el('span', { class:'mono tv-name' }, r.name.toUpperCase()),
    ]),
    el('div', { class:'tv-body' }, [
      el('div', { class:'tv-motto' }, r.motto),
      el('div', { class:'tv-blurb' }, r.blurb),
      el('div', { class:'tv-counts mono' }, [
        el('span', {}, `${gyms.length} ginásios`),
        el('span', {}, '·'),
        el('span', {}, `${four.length} Elite 4`),
        el('span', {}, '·'),
        el('span', {}, '1 Campeão'),
      ]),
    ]),
    el('div', { class:'tv-cta mono' }, 'VIAJAR ▸'),
  ]);
}

function travelTo(ctx, regionId){
  ctx.save.trainer.region = regionId;
  ctx.saveAndSync();
}
