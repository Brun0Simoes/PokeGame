/* ============================================================
   auth.js — title screen, login, register, region & starter pick
   ============================================================ */

import { Store, newSave } from './storage.js';
import { REGIONS, STARTERS, TYPE_COLOR } from './data.js';
import { api, makeMon } from './api.js';
import { audio } from './audio.js';
import { go } from './router.js';
import { $, el, mount, toast, button, dialogBox, typeChip } from './ui.js';

const state = {
  mode: 'title',   // title | login | register | region | starter | creating
  email: '',
  password: '',
  trainerName: '',
  regionId: null,
  starterId: null,
};

export async function renderAuth(root){
  // Always reset music to "route" mood on auth
  audio.startMusic && audio.musicOn && audio.startMusic('route');
  mount(root, await build());
}

async function build(){
  const wrap = el('div', { class: 'auth-screen' }, [
    skyDecor(),
    el('div', { class: 'auth-stage' }, [
      el('div', { class: 'auth-card panel' }, await renderMode()),
    ]),
    el('div', { class: 'auth-footer' }, [
      el('span', {}, 'POCKET·AR · EDUCATIONAL FAN PROTOTYPE'),
      el('span', { class: 'mono' }, 'v0.3'),
    ]),
  ]);
  return wrap;
}

function skyDecor(){
  return el('div', { class: 'sky-decor' }, [
    el('div', { class: 'cloud c1' }),
    el('div', { class: 'cloud c2' }),
    el('div', { class: 'cloud c3' }),
    el('div', { class: 'ground-strip' }),
    el('div', { class: 'sparkles' }),
  ]);
}

async function renderMode(){
  switch(state.mode){
    case 'title':    return titleView();
    case 'login':    return loginView();
    case 'register': return registerView();
    case 'region':   return regionView();
    case 'starter':  return await starterView();
    case 'creating': return creatingView();
  }
}

async function refresh(){
  const card = $('.auth-card');
  if(card) mount(card, ...(await renderMode()));
}

/* -------- TITLE -------- */
function titleView(){
  const accounts = Store.listAccounts();
  return [
    el('div', { class: 'title-mark' }, [
      el('div', { class:'pokeball big' }),
      el('div', { class:'title-text' }, [
        el('h1', {}, ['Pocket', el('br'), el('span',{class:'accent'}, 'Quest')]),
        el('div', { class:'subtitle' }, 'AR ENCOUNTER · REGIÕES & GINÁSIOS'),
      ]),
    ]),
    el('div', { class:'press-start' }, '▸ PRESSIONE START'),
    el('div', { class:'title-actions' }, [
      button({ label:'NOVO JOGO', kind:'primary', onClick: ()=>{ audio.playSfx('open'); state.mode='register'; refresh(); } }),
      button({ label:'CONTINUAR', kind:'blue', onClick: ()=>{ audio.playSfx('open'); state.mode='login'; refresh(); }, disabled: accounts.length===0 }),
    ]),
    accounts.length===0 ? null : el('div', { class:'recent-accounts' }, [
      el('div', { class:'rs-label' }, 'CONTAS SALVAS'),
      el('div', { class:'rs-list' }, accounts.slice(0,4).map(a => el('button', {
        class:'rs-chip',
        onClick:()=>{ state.email = a.email; state.mode='login'; audio.playSfx('select'); refresh(); }
      }, [
        el('span', { class:'rs-pk' }),
        el('span', {}, [ el('strong',{}, a.trainerName), el('br'), el('small',{}, a.email) ]),
      ]))),
    ]),
    el('div', { class:'title-legal' }, 'Protótipo educacional. Pokémon e demais propriedades intelectuais pertencem a seus respectivos donos.'),
  ];
}

/* -------- LOGIN -------- */
function loginView(){
  const errorEl = el('div', { class:'auth-error' });
  const emailIn = el('input', { type:'email', placeholder:'voce@email.com', class:'auth-input', value: state.email });
  const pwIn    = el('input', { type:'password', placeholder:'••••••••', class:'auth-input' });
  emailIn.addEventListener('input', e=>{ state.email = e.target.value; });

  const submit = async (e)=>{
    e?.preventDefault?.();
    errorEl.textContent = '';
    try{
      Store.login(emailIn.value.trim(), pwIn.value);
      audio.playSfx('success');
      go('/game/wild');
    }catch(err){
      errorEl.textContent = err.message;
      audio.playSfx('error');
    }
  };

  return [
    el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span', {}, '◢ ENTRAR'), el('button',{ class:'panel-bar-back', onClick:back }, 'VOLTAR') ]),
    el('div', { class:'auth-body' }, [
      el('p', { class:'dialog-msg' }, 'Bem-vindo de volta, treinador. Entre com sua conta para continuar a aventura.'),
      el('form', { class:'auth-form', onSubmit: submit }, [
        labeled('E-MAIL', emailIn),
        labeled('SENHA', pwIn),
        errorEl,
        el('div', { class:'form-actions' }, [
          button({ label:'ENTRAR', kind:'primary', onClick: submit }),
        ]),
      ]),
      el('div', { class:'auth-switch' }, [
        'Não tem conta? ',
        el('a', { href:'#', onClick:e=>{ e.preventDefault(); state.mode='register'; refresh(); } }, 'Crie agora →'),
      ]),
    ]),
  ];
}

/* -------- REGISTER -------- */
function registerView(){
  const errorEl = el('div', { class:'auth-error' });
  const nameIn  = el('input', { type:'text',    placeholder:'Ex.: Mateus', class:'auth-input', maxlength:14, value:state.trainerName });
  const emailIn = el('input', { type:'email',   placeholder:'voce@email.com', class:'auth-input', value:state.email });
  const pwIn    = el('input', { type:'password',placeholder:'Mínimo 4 caracteres', class:'auth-input' });
  const pw2In   = el('input', { type:'password',placeholder:'Repita a senha', class:'auth-input' });
  nameIn.addEventListener('input',  e=>{ state.trainerName = e.target.value; });
  emailIn.addEventListener('input', e=>{ state.email       = e.target.value; });

  const submit = (e)=>{
    e?.preventDefault?.();
    errorEl.textContent = '';
    const name  = nameIn.value.trim();
    const email = emailIn.value.trim();
    const pw    = pwIn.value;
    const pw2   = pw2In.value;
    if(name.length < 2){ errorEl.textContent='Nome muito curto.'; audio.playSfx('error'); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ errorEl.textContent='E-mail inválido.'; audio.playSfx('error'); return; }
    if(pw.length < 4){ errorEl.textContent='Senha deve ter pelo menos 4 caracteres.'; audio.playSfx('error'); return; }
    if(pw !== pw2){ errorEl.textContent='Senhas não conferem.'; audio.playSfx('error'); return; }
    if(Store.findAccount(email)){ errorEl.textContent='Já existe uma conta com esse e-mail.'; audio.playSfx('error'); return; }
    // Move forward without creating account yet — we need region + starter first
    state.trainerName = name;
    state.email = email;
    state.password = pw;
    state.mode = 'region';
    audio.playSfx('open');
    refresh();
  };

  return [
    el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span', {}, '◢ NOVO TREINADOR'), el('button',{ class:'panel-bar-back', onClick:back }, 'VOLTAR') ]),
    el('div', { class:'auth-body' }, [
      el('p', { class:'dialog-msg' }, 'Bem-vindo, novo treinador! O Professor está esperando para te conhecer. Preencha seus dados para começar.'),
      el('form', { class:'auth-form', onSubmit: submit }, [
        labeled('NOME DO TREINADOR', nameIn),
        labeled('E-MAIL', emailIn),
        labeled('SENHA', pwIn),
        labeled('CONFIRMAR SENHA', pw2In),
        errorEl,
        el('div', { class:'form-actions' }, [
          button({ label:'PRÓXIMO ▸ ESCOLHER REGIÃO', kind:'primary', onClick: submit }),
        ]),
      ]),
      el('div', { class:'auth-switch' }, [
        'Já tem conta? ',
        el('a', { href:'#', onClick:e=>{ e.preventDefault(); state.mode='login'; refresh(); } }, 'Entrar agora →'),
      ]),
    ]),
  ];
}

/* -------- REGION SELECT -------- */
function regionView(){
  return [
    el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, '◢ ESCOLHA SUA REGIÃO'), el('button',{ class:'panel-bar-back', onClick:back }, 'VOLTAR') ]),
    el('div', { class:'auth-body wide' }, [
      el('p', { class:'dialog-msg', html:`Olá, <b>${escapeHtml(state.trainerName)}</b>! Cada região do mundo tem seu próprio professor, seus Pokémon iniciais e seus 8 ginásios. Onde sua jornada vai começar?` }),
      el('div', { class:'region-grid' },
        REGIONS.map(r => el('button', {
          class:'region-card'+(state.regionId===r.id?' selected':''),
          onClick: ()=>{ state.regionId = r.id; audio.playSfx('select'); refresh(); }
        }, [
          el('div', { class:'rc-bar', style:{ background: `linear-gradient(180deg, ${r.color}, ${r.accent})` } }, [
            el('span',{ class:'rc-gen', style:{ color: r.color } }, 'GEN '+r.gen),
            el('span',{ class:'rc-name' }, r.name.toUpperCase()),
          ]),
          el('div', { class:'rc-body' }, [
            el('div', { class:'rc-motto' }, r.motto),
            el('div', { class:'rc-blurb' }, r.blurb),
            el('div', { class:'rc-starters' }, r.starters.map(id => {
              const s = STARTERS[id];
              const tc = s ? TYPE_COLOR[s.types[0]] : '#888';
              return el('span', { class:'rc-starter', style:{ background:tc } }, s ? s.name : '?');
            })),
          ]),
          state.regionId===r.id && el('div', { class:'rc-check' }, '✓'),
        ]))
      ),
      el('div', { class:'form-actions center' }, [
        button({ label:'CONFIRMAR REGIÃO ▸', kind:'primary', disabled: !state.regionId, onClick: ()=>{ state.mode='starter'; audio.playSfx('open'); refresh(); } }),
      ]),
    ]),
  ];
}

/* -------- STARTER SELECT -------- */
async function starterView(){
  const region = REGIONS.find(r=>r.id===state.regionId);
  if(!region) return regionView();

  // pre-fetch starter sprites so the selection is interactive
  const starterDataLoading = el('div', { class:'starter-loading' }, [
    el('span', { class:'spinner' }), 'Carregando Pokémon iniciais...',
  ]);

  const grid = el('div', { class:'starter-grid' }, starterDataLoading);
  const continueBtn = button({
    label:'COMEÇAR JORNADA ▸', kind:'primary', disabled:!state.starterId,
    onClick: ()=>{ if(state.starterId){ state.mode='creating'; audio.playSfx('success'); refresh(); finalize(); } }
  });

  const view = [
    el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span',{}, `◢ ESCOLHA SEU INICIAL · ${region.name.toUpperCase()}`), el('button',{ class:'panel-bar-back', onClick: ()=>{ state.mode='region'; refresh(); } }, 'VOLTAR') ]),
    el('div', { class:'auth-body wide' }, [
      el('p', { class:'dialog-msg', html: `Professor: <i>"${region.name}, hein? Eu tenho três Pokémon aqui para te oferecer. Escolha com cuidado..."</i>` }),
      grid,
      el('div', { class:'form-actions center' }, [ continueBtn ]),
    ]),
  ];

  // load starters in parallel
  (async ()=>{
    const data = await Promise.all(region.starters.map(id => api.getPokemon(id)));
    const cards = data.map((p, idx)=>{
      const id = region.starters[idx];
      const starter = STARTERS[id];
      if(!p) return el('div', { class:'starter-card error' }, 'Erro');
      const sprite = api.getBestSprite(p, 'showdown', false);
      return el('button', {
        class:'starter-card'+(state.starterId===id?' selected':''),
        onClick: ()=>{ state.starterId = id; audio.playSfx('select'); refresh(); }
      }, [
        el('div', { class:'sc-frame', style:{ background:`radial-gradient(circle, ${starter.color}33, transparent 70%)` } }, [
          el('img', { src: sprite, alt: p.name, style:{ imageRendering:'pixelated' } }),
        ]),
        el('div', { class:'sc-name' }, p.name.toUpperCase()),
        el('div', { class:'sc-types' }, p.types.map(t => typeChip(t.type.name))),
        el('div', { class:'sc-stats' }, [
          stat('HP', p.stats.find(s=>s.stat.name==='hp').base_stat),
          stat('ATQ', p.stats.find(s=>s.stat.name==='attack').base_stat),
          stat('DEF', p.stats.find(s=>s.stat.name==='defense').base_stat),
          stat('VEL', p.stats.find(s=>s.stat.name==='speed').base_stat),
        ]),
        state.starterId===id && el('div', { class:'sc-check' }, '✓'),
      ]);
    });
    mount(grid, ...cards);
  })();

  return view;
}
function stat(lbl, v){
  return el('div', { class:'sc-stat' }, [
    el('span', { class:'sc-stat-l' }, lbl),
    el('div', { class:'sc-stat-bar' }, [ el('div', { style:{ width: Math.min(100, v/200*100)+'%' } }) ]),
    el('span', { class:'sc-stat-v' }, v),
  ]);
}

/* -------- CREATING SAVE -------- */
function creatingView(){
  return [
    el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span', {}, '◢ CRIANDO SAVE') ]),
    el('div', { class:'auth-body center' }, [
      el('div', { class:'pokeball-spinner' }),
      el('div', { class:'creating-text' }, 'Empacotando sua Pokédex...'),
      el('div', { class:'creating-sub' }, 'Conversando com o professor da região, carregando seu inicial...'),
    ]),
  ];
}

async function finalize(){
  try{
    // Create the starter mon
    const starter = await makeMon({
      speciesIdOrName: state.starterId,
      level: 5,
      shiny: false,
      source: 'starter',
      ball: 'poke-ball',
      spriteStyle: 'showdown',
    });
    if(!starter) throw new Error('Falha ao carregar o Pokémon inicial.');

    const acc = Store.createAccount({
      email: state.email,
      password: state.password,
      trainerName: state.trainerName,
      regionId: state.regionId,
      starterId: state.starterId,
    });
    const save = newSave({
      trainerName: state.trainerName,
      regionId: state.regionId,
      starter,
    });
    // Mark starter as seen + caught in Pokédex
    save.pokedex.seen[starter.id]  = { name: starter.name, types: starter.types, sprite: starter.sprite.front, at: Date.now() };
    save.pokedex.caught[starter.id] = { name: starter.name, types: starter.types, sprite: starter.sprite.front, at: Date.now(), region: state.regionId };

    Store.setSave(acc.email, save);
    Store.login(state.email, state.password);
    audio.playSfx('success');
    setTimeout(()=>{ go('/game/wild'); }, 900);
  }catch(err){
    console.error(err);
    toast('Erro: '+err.message, 'fail');
    state.mode = 'starter';
    refresh();
  }
}

function labeled(label, input){
  return el('label', { class:'auth-label' }, [
    el('span', { class:'al-text' }, label),
    input,
  ]);
}
function back(){
  audio.playSfx('cancel');
  const order = ['title','login','register','region','starter'];
  if(state.mode==='starter') state.mode='region';
  else if(state.mode==='region') state.mode='register';
  else state.mode='title';
  refresh();
}
function escapeHtml(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* If we re-enter auth with a stale email selected (e.g. user
   clicked a "recent accounts" chip), pre-fill the form. */
export function resetAuth(){
  state.mode = 'title';
  state.password = '';
  state.starterId = null;
  state.regionId  = null;
}
