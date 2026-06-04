/* ============================================================
   tabs/online.js — "Liga Online" (simulated multiplayer lobby)
   - Live presence list: bot trainers + other local accounts.
   - Battle invites that launch a real PvP-style fight vs the
     opponent's team.
   - Presence is localStorage-backed (a heartbeat key per account)
     so multiple accounts in the SAME browser truly see each other.
   - Structured so a real WebSocket backend could replace the
     `Presence` adapter later without touching the UI.
   ============================================================ */

import { el, mount, button, toast, confirmModal } from '../ui.js';
import { audio } from '../audio.js';
import { Store } from '../storage.js';
import { REGIONS, REGION_POOL } from '../data.js';
import { runQuickBattle } from '../battle.js';
import { trainerSpriteTile } from '../trainer-sprite.js';
import { Net, NET_CONFIG } from '../net.js';

const ONLINE_WINDOW = NET_CONFIG.onlineWindowMs;
const HEARTBEAT_MS  = NET_CONFIG.heartbeatMs;

/* ---- Bot trainers (always "online") ---- */
const BOTS = [
  { id:'bot-red',   name:'Red',     sprite:'red',     region:'kanto',  level:48, blurb:'Silencioso. Lendário.' },
  { id:'bot-blue',  name:'Blue',    sprite:'blue',    region:'kanto',  level:46, blurb:'Sempre um passo à frente.' },
  { id:'bot-leaf',  name:'Leaf',    sprite:'leaf',    region:'kanto',  level:40, blurb:'Coletora veterana.' },
  { id:'bot-ethan', name:'Ethan',   sprite:'ethan',   region:'johto',  level:38, blurb:'Criador de Johto.' },
  { id:'bot-lyra',  name:'Lyra',    sprite:'lyra',    region:'johto',  level:36, blurb:'Anda com um Marill.' },
  { id:'bot-brendan',name:'Brendan',sprite:'brendan', region:'hoenn',  level:34, blurb:'Explorador de Hoenn.' },
  { id:'bot-may',   name:'May',     sprite:'may',     region:'hoenn',  level:33, blurb:'Pesquisadora de campo.' },
  { id:'bot-lucas', name:'Lucas',   sprite:'lucas',   region:'sinnoh', level:30, blurb:'Estudioso de Sinnoh.' },
  { id:'bot-dawn',  name:'Dawn',    sprite:'dawn',    region:'sinnoh', level:29, blurb:'Coordenadora animada.' },
  { id:'bot-hilbert',name:'Hilbert',sprite:'hilbert', region:'unova',  level:26, blurb:'Novato ambicioso.' },
  { id:'bot-nate',  name:'Nate',    sprite:'nate',    region:'unova',  level:22, blurb:'Sempre treinando.' },
  { id:'bot-calem', name:'Calem',   sprite:'calem',   region:'kalos',  level:18, blurb:'Estiloso de Kalos.' },
];

export function renderOnline(root, ctx){
  const { account, save } = ctx;
  const view = el('div', { class:'tab-page online-page' });
  mount(root, view);

  const me = () => ({
    email: account.email, name: save.trainer.name, region: save.trainer.region,
    level: save.trainer.level, party: save.party.length,
    badges: save.progress.gymsBeaten.length,
  });

  // presence state fed by the Net adapter
  let livePlayers = [];
  Net.on('presence', ({ players }) => {
    const now = Date.now();
    livePlayers = (players||[]).filter(p => !p.ts || now - p.ts < ONLINE_WINDOW);
    refresh();
  });
  // incoming invite from a real peer (socket mode)
  Net.on('invite', ({ from, battleId }) => {
    if(!from) return;
    toast(`${from.name||from.email} te convidou para batalhar!`, 'info');
  });
  Net.connect(me());
  const beat = setInterval(()=>Net.beat(me()), HEARTBEAT_MS);
  const tick = setInterval(()=>refresh(), 3000);

  function botStatus(bot){
    // deterministic-ish idle/online flutter
    return (Math.floor(Date.now()/15000) + bot.name.length) % 5 === 0 ? 'idle' : 'online';
  }

  function refresh(){
    const others = livePlayers.filter(p => p.email !== account.email);
    const players = [
      ...others.map(p => ({ kind:'player', id:p.email, name:p.name, region:p.region, level:p.level, badges:p.badges, sprite:'red', status:'online' })),
      ...BOTS.map(b => ({ kind:'bot', id:b.id, name:b.name, region:b.region, level:b.level, sprite:b.sprite, blurb:b.blurb, status:botStatus(b) })),
    ];
    const onlineCount = players.filter(p=>p.status==='online').length;

    mount(view,
      el('div', { class:'page-head' }, [
        el('h1', {}, 'Liga Online'),
        el('p', { class:'page-sub' },
          `${onlineCount} treinadores online agora. Convide alguém para uma batalha amistosa 6v6.`),
      ]),

      // your presence card
      el('div', { class:'panel page-panel ol-self' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ SEU STATUS'), el('span',{class:'right mono ol-live'}, '● ONLINE') ]),
        el('div', { class:'panel-body ol-self-body' }, [
          trainerSpriteTile({ key:'red', name: save.trainer.name, size:56, accent:(REGIONS.find(r=>r.id===save.trainer.region)?.color) }),
          el('div', {}, [
            el('div', { class:'ol-self-name mono' }, save.trainer.name.toUpperCase()),
            el('div', { class:'ol-self-meta mono' }, `Lv.${save.trainer.level} · ${(REGIONS.find(r=>r.id===save.trainer.region)?.name)||'—'} · ${save.party.length} na equipe`),
          ]),
          el('div', { class:'ol-self-hint dim small' }, 'Abra esta página em outra aba/conta para batalhar de verdade entre saves.'),
        ]),
      ]),

      // online list
      el('div', { class:'panel page-panel' }, [
        el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ TREINADORES'), el('span',{class:'right mono', style:{fontSize:'8px'}}, `${players.length} listados`) ]),
        el('div', { class:'panel-body' }, [
          el('div', { class:'ol-grid' }, players.map(p => playerCard(p))),
        ]),
      ]),

      el('p', { class:'dim small', style:{textAlign:'center'} },
        'Nota: este é um lobby simulado no navegador. Treinadores-bot estão sempre disponíveis; outras contas reais aparecem se abertas neste mesmo navegador. Uma versão com servidor real (WebSocket) pode substituir esta camada.'),
    );
  }

  function playerCard(p){
    const region = REGIONS.find(r=>r.id===p.region);
    const offline = p.status !== 'online';
    return el('div', { class:'ol-card'+(offline?' idle':'') }, [
      el('div', { class:'ol-card-spr' }, [ trainerSpriteTile({ key:p.sprite, name:p.name, size:64, accent: region?.color }) ]),
      el('div', { class:'ol-card-info' }, [
        el('div', { class:'ol-card-top' }, [
          el('span', { class:'ol-card-name mono' }, p.name.toUpperCase()),
          el('span', { class:'ol-status '+(offline?'idle':'on') }, offline?'AUSENTE':'ONLINE'),
        ]),
        el('div', { class:'ol-card-meta mono' }, `Lv.${p.level} · ${region?.name||'—'}` + (p.kind==='player'?` · ${p.badges||0} insíg.`:'')),
        p.blurb && el('div', { class:'ol-card-blurb' }, p.blurb),
      ]),
      el('div', { class:'ol-card-cta' }, [
        button({ label: offline?'AUSENTE':'DESAFIAR ▸', kind:'primary', disabled: offline, onClick: ()=>invite(p) }),
      ]),
    ]);
  }

  async function invite(p){
    audio.playSfx('select');
    const ok = await confirmModal({
      title:'CONVITE DE BATALHA',
      message:`Enviar convite de batalha 6v6 para <b>${p.name}</b>?`,
      confirmLabel:'CONVIDAR', cancelLabel:'CANCELAR',
    });
    if(!ok) return;
    // simulate the opponent accepting
    toast(`Convite enviado a ${p.name}…`, 'info');
    await wait(900);
    if(Math.random() < 0.12){
      toast(`${p.name} está ocupado e recusou.`, 'fail');
      audio.playSfx('cancel');
      return;
    }
    toast(`${p.name} aceitou! Preparando arena…`, 'success');
    audio.playSfx('success');
    await wait(600);
    startPvp(p);
  }

  async function startPvp(p){
    if(save.party.filter(m=>m.hp>0).length === 0){
      toast('Sua equipe está nocauteada. Cure no Centro Pokémon.', 'fail');
      audio.playSfx('error'); return;
    }
    const team = buildTeam(p);
    // PHASE 3: seed deterministico para PvP. Player com email "menor"
    // gera o seed; assim ambos chegam ao mesmo valor sem trocar mensagem.
    // (Para bots usamos seed null = Math.random)
    let seed = null;
    if(p.kind === 'player'){
      const { newBattleSeed } = await import('../battle-core.js');
      const myEmail = account.email || '';
      const otherEmail = p.id || '';
      // tie-break por ordem alfabetica: o "menor" gera o seed
      if(myEmail < otherEmail){
        seed = newBattleSeed();
        Net.send({ t:'team', to: p.id, battleId: 'pvp-'+Date.now(), team: team.map(m=>({id:m.id,lvl:m.lvl})), seed });
      }
    }
    const result = await runQuickBattle({
      ctx,
      opponentLabel: `${p.name}`,
      opponentTeam: team,
      sprite: p.sprite,
      musicMood: 'battle',
      seed,
    });
    if(result === 'win'){
      const reward = 600 + p.level * 25;
      save.trainer.money += reward;
      toast(`Você venceu ${p.name}! +₽${reward.toLocaleString('pt-BR')}`, 'success');
      ctx.saveAndSync();
    }
    refresh();
  }

  /* Build an opponent team from their region + level (6 mons) */
  function buildTeam(p){
    let pool = null;
    if(p.kind === 'player'){
      const oppSave = Store.getSave(p.id);
      if(oppSave && oppSave.party && oppSave.party.length){
        return oppSave.party.map(m => ({ id:m.id, lvl:m.level }));
      }
    }
    const [lo, hi] = REGION_POOL[p.region] || REGION_POOL.kanto;
    const team = [];
    for(let i=0;i<6;i++){
      const id = lo + Math.floor(Math.random()*(hi-lo+1));
      const lvl = Math.max(5, p.level + Math.floor(Math.random()*5) - 2);
      team.push({ id, lvl });
    }
    return team;
  }

  // cleanup on tab switch
  return () => { clearInterval(beat); clearInterval(tick); Net.disconnect(); };
}

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
