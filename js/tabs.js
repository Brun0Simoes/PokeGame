/* ============================================================
   tabs.js — aggregator for tab renderers
   Each tab lives in its own file under js/tabs/.
   Each renderer signature:
     (root: HTMLElement, ctx: { account, save, saveAndSync(), go, toast }) => disposeFn|void|Promise
   ============================================================ */

export { renderWild }       from './tabs/wild.js';
export { renderProfile }    from './tabs/profile.js';
export { renderTeam }       from './tabs/team.js';
export { renderPC }         from './tabs/pc.js';
export { renderShop }       from './tabs/shop.js';
export { renderTrainers }   from './tabs/trainers.js';
export { renderGyms }       from './tabs/gyms.js';
export { renderElite }      from './tabs/elite.js';
export { renderBag }        from './tabs/bag.js';
export { renderPokeCenter } from './tabs/pokecenter.js';
export { renderPokedex }    from './tabs/pokedex.js';
export { renderTravel }     from './tabs/travel.js';
export { renderQuests }     from './tabs/quests.js';
export { renderDaycare }    from './tabs/daycare.js';
export { renderTower }      from './tabs/tower.js';
export { renderRanking }    from './tabs/ranking.js';
export { renderOnline }     from './tabs/online.js';
export { renderSettings }   from './tabs/settings.js';
