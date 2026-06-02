/* ============================================================
   tabs/tower.js — Battle Tower: endless escalating gauntlet
   Win streak grows; opponents level up; rewards scale.
   ============================================================ */

import { el, mount, button, toast } from '../ui.js';
import { audio } from '../audio.js';
import { runQuickBattle } from '../battle.js';

const POOL = [
  // strong species pool drawn from across regions for variety
  6,9,3,65,94,130,143,149,248,257,260,282,376,445,448,461,609,635,658,681,700,706,884,887,892,
];

export function renderTower(root, ctx){
  const { save } = ctx;
  if(!save.tower) save.tower = { best:0, streak:0 };
  const view = el('div', { class:'tab-page tower-page' });
  mount(root, view);
  refresh();

  function refresh(){
    const t = save.tower;
    const tier = Math.floor(t.streak/7) + 1;
    const lvl = Math.min(100, 35 + t.streak*3);
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Torre de Batalha'),
        el('p', { class:'page-sub' }, 'Enfrente treinadores cada vez mais fortes sem cura entre lutas. Quanto maior a sequência, maiores os prêmios.'),
      ]),
      el('div', { class:'tower-hero panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ DESAFIO DA TORRE') ]),
        el('div', { class:'panel-body' }, [
          el('div', { class:'tw-stats' }, [
            twStat('SEQUÊNCIA ATUAL', t.streak, '#DC3545'),
            twStat('RECORDE', t.best, '#F2B939'),
            twStat('ANDAR', tier, '#2D5BD1'),
            twStat('NÍVEL INIMIGO', '~'+lvl, '#735797'),
          ]),
          el('p', { class:'dialog-msg', style:{marginTop:'10px'} },
            save.party.filter(m=>m.hp>0).length === 0
              ? 'Sua equipe está nocauteada. Cure no Centro Pokémon antes de desafiar a Torre.'
              : t.streak>0
                ? `Você está numa sequência de <b>${t.streak}</b> vitórias! Continue ou pare para garantir o recorde.`
                : 'Comece um novo desafio. Cada vitória aumenta a recompensa; uma derrota zera a sequência.'),
          el('div', { class:'row gap', style:{marginTop:'10px'} }, [
            button({ label: t.streak>0 ? 'PRÓXIMA BATALHA ▸' : 'INICIAR DESAFIO ▸', kind:'primary',
              disabled: save.party.filter(m=>m.hp>0).length===0, onClick:()=>doFight() }),
            t.streak>0 && button({ label:'ENCERRAR (GUARDAR RECORDE)', kind:'ghost', onClick:()=>{ stop(); } }),
          ]),
        ]),
      ]),
    );
  }

  function twStat(lbl, val, color){
    return el('div', { class:'tw-stat', style:{ '--c':color } }, [
      el('div', { class:'tw-stat-v' }, String(val)),
      el('div', { class:'tw-stat-l' }, lbl),
    ]);
  }

  async function doFight(){
    const t = save.tower;
    const lvl = Math.min(100, 35 + t.streak*3);
    // build a random 3-mon team
    const team = [];
    const used = new Set();
    while(team.length < 3){
      const id = POOL[Math.floor(Math.random()*POOL.length)];
      if(used.has(id)) continue; used.add(id);
      team.push({ id, lvl: lvl + Math.floor(Math.random()*3) });
    }
    const names = ['Ás','Mestre','Veterano','Campeão','Lenda','Elite','Cobra','Furacão'];
    const label = `${names[Math.floor(Math.random()*names.length)]} da Torre`;
    const result = await runQuickBattle({ ctx, opponentLabel: label, opponentTeam: team, sprite:'veteranm', musicMood:'gym' });
    if(result === 'win'){
      t.streak++;
      if(t.streak > t.best) t.best = t.streak;
      const reward = 500 + t.streak*250;
      save.trainer.money += reward;
      audio.playSfx('success');
      toast(`Vitória ${t.streak}! +₽${reward.toLocaleString('pt-BR')}`, 'success');
      // milestone item every 7 wins
      if(t.streak % 7 === 0){
        if(!save.bag.balls) save.bag.balls = {};
        save.bag.balls['master-ball'] = (save.bag.balls['master-ball']||0) + 1;
        toast('Marco da Torre! Você ganhou uma Master Ball!', 'success');
      }
      ctx.saveAndSync(); refresh();
    } else {
      audio.playSfx('error');
      toast(`A sequência terminou em ${t.streak}.`, 'fail');
      t.streak = 0;
      ctx.saveAndSync(); refresh();
    }
  }
  function stop(){
    save.tower.streak = 0;
    audio.playSfx('select');
    toast('Desafio encerrado. Recorde guardado!', 'info');
    ctx.saveAndSync(); refresh();
  }
}
