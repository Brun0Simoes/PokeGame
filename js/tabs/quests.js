/* ============================================================
   tabs/quests.js — daily quests + career achievements, claimable
   ============================================================ */

import { el, mount, button, toast } from '../ui.js';
import { audio } from '../audio.js';
import { ACHIEVEMENTS, ensureQuestState, rollDaily, grantReward, rewardText } from '../quests.js';

export function renderQuests(root, ctx){
  const { save } = ctx;
  ensureQuestState(save);
  const view = el('div', { class:'tab-page quests-page' });
  mount(root, view);
  refresh();

  function refresh(){
    rollDaily(save);
    const daily = save.quests.daily.goals;
    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Missões & Conquistas'),
        el('p', { class:'page-sub' }, 'Cumpra metas diárias e marcos de carreira para ganhar recompensas.'),
      ]),

      // Daily quests
      el('div', { class:'panel page-panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ MISSÕES DIÁRIAS'), el('span',{class:'right mono', style:{fontSize:'8px'}}, 'RESETA À MEIA-NOITE') ]),
        el('div', { class:'panel-body' }, [
          el('div', { class:'quest-list' }, daily.map(g => questRow(g, 'daily'))),
        ]),
      ]),

      // Achievements
      el('div', { class:'panel page-panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ CONQUISTAS DE CARREIRA') ]),
        el('div', { class:'panel-body' }, [
          el('div', { class:'quest-list' }, ACHIEVEMENTS.map(a => {
            const done = a.test(save);
            const claimed = save.quests.claimed.includes(a.id);
            return achRow(a, done, claimed);
          })),
        ]),
      ]),
    );
  }

  function questRow(g, kind){
    const pct = Math.min(100, g.progress/g.target*100);
    return el('div', { class:'quest-row'+(g.done?' done':'') }, [
      el('div', { class:'q-check' }, g.done ? '✓' : '○'),
      el('div', { class:'q-main' }, [
        el('div', { class:'q-name' }, g.name),
        el('div', { class:'q-bar' }, [ el('div', { class:'q-fill', style:{ width:pct+'%' } }) ]),
        el('div', { class:'q-meta mono' }, `${g.progress}/${g.target} · ${rewardText(g.reward)}`),
      ]),
      el('div', { class:'q-cta' }, [
        g.claimed
          ? el('span', { class:'q-claimed mono' }, 'RESGATADO')
          : button({ label:'RESGATAR', kind:'primary', disabled:!g.done, onClick:()=>claimDaily(g) }),
      ]),
    ]);
  }
  function achRow(a, done, claimed){
    return el('div', { class:'quest-row'+(done?' done':'') }, [
      el('div', { class:'q-check' }, done ? '✓' : '○'),
      el('div', { class:'q-main' }, [
        el('div', { class:'q-name' }, a.name),
        el('div', { class:'q-desc dim' }, a.desc),
        el('div', { class:'q-meta mono' }, rewardText(a.reward)),
      ]),
      el('div', { class:'q-cta' }, [
        claimed
          ? el('span', { class:'q-claimed mono' }, 'RESGATADO')
          : button({ label:'RESGATAR', kind:'primary', disabled:!done, onClick:()=>claimAch(a) }),
      ]),
    ]);
  }

  function claimDaily(g){
    if(!g.done || g.claimed) return;
    g.claimed = true;
    grantReward(save, g.reward);
    audio.playSfx('success');
    toast('Recompensa resgatada: '+rewardText(g.reward), 'success');
    ctx.saveAndSync(); refresh();
  }
  function claimAch(a){
    if(save.quests.claimed.includes(a.id)) return;
    save.quests.claimed.push(a.id);
    grantReward(save, a.reward);
    audio.playSfx('success');
    toast('Conquista resgatada: '+rewardText(a.reward), 'success');
    ctx.saveAndSync(); refresh();
  }
}
