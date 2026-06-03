/* ============================================================
   tabs/settings.js
   ============================================================ */

import { el, mount, button, confirmModal, toast } from '../ui.js';
import { audio } from '../audio.js';
import { Store } from '../storage.js';

export function renderSettings(root, ctx){
  const { save, account } = ctx;
  const s = save.settings;

  function setVol(v){
    s.volume = v;
    audio.setVolume(v);
    ctx.saveAndSync();
  }
  function setMusic(on){
    s.music = on; audio.setMusicOn(on); ctx.saveAndSync();
  }
  function setSfx(on){
    s.sfx = on; audio.setSfxOn(on); audio.playSfx('click'); ctx.saveAndSync();
  }

  const volIn = el('input', { type:'range', min:0, max:1, step:0.05, value:s.volume });
  volIn.addEventListener('input', e=>setVol(parseFloat(e.target.value)));

  function refresh(){ mount(root, buildView()); }
  function difficultyRow(){
    const opts = [['easy','FÁCIL'],['normal','NORMAL'],['hard','DIFÍCIL']];
    const cur = s.difficulty || 'normal';
    return el('div', { class:'row gap', style:{flexWrap:'wrap'} }, opts.map(([id,lbl])=>
      el('button', { class:'diff-btn'+(cur===id?' on':''), onClick:()=>{ s.difficulty=id; audio.playSfx('select'); ctx.saveAndSync(); refresh(); } }, lbl)));
  }
  function teamNameInput(){
    const inp = el('input', { class:'auth-input', style:{maxWidth:'180px'}, value: s.teamName||'', placeholder:'Equipe Relâmpago' });
    inp.addEventListener('change', ()=>{ s.teamName = inp.value.slice(0,18); ctx.saveAndSync(); });
    return inp;
  }
  function avatarPicker(){
    const AVATARS = ['red','blue','leaf','ethan','lyra','brendan','may','lucas','dawn'];
    const cur = s.avatar || 'red';
    return el('div', { class:'avatar-grid' }, AVATARS.map(a=>
      el('button', { class:'avatar-opt'+(cur===a?' on':''), onClick:()=>{ s.avatar=a; audio.playSfx('select'); ctx.saveAndSync(); refresh(); } }, [
        el('img', { src:`https://play.pokemonshowdown.com/sprites/trainers/${a}.png`, alt:a, style:{imageRendering:'pixelated'} })
      ])));
  }

  mount(root, buildView());

  function buildView(){ return (
    el('div', { class:'tab-page' }, [
      header('Configurações', 'Sons, conta e dados do jogo.'),
      el('div', { class:'grid-2' }, [
        // Difficulty panel
        panel('◢ DIFICULDADE', [
          el('p', { class:'dim small' }, 'Escolha como quer jogar. O modo Nuzlocke aplica regras hardcore.'),
          difficultyRow(),
          toggleRow('Modo Nuzlocke (permadeath)', !!s.nuzlocke, on=>{ s.nuzlocke=on; ctx.saveAndSync(); if(on) toast('Nuzlocke ativado: Pokémon nocauteados em batalha são liberados para sempre.', 'info'); }),
          el('p', { class:'dim small', style:{marginTop:'6px'} }, 'Nuzlocke: ao desmaiar numa batalha, o Pokémon é liberado permanentemente.'),
        ]),
        // Customization panel
        panel('◢ PERSONALIZAÇÃO', [
          el('div', { class:'row' }, [ el('label',{class:'row-l'}, 'NOME DA EQUIPE'), teamNameInput() ]),
          el('label', { class:'al-text', style:{marginTop:'10px'} }, 'AVATAR DO TREINADOR'),
          avatarPicker(),
        ]),
      ]),
      el('div', { class:'grid-2' }, [
        // Audio panel
        panel('◢ ÁUDIO', [
          toggleRow('Música', s.music, on => { setMusic(on); }),
          toggleRow('Efeitos sonoros', s.sfx, on => { setSfx(on); }),
          el('div', { class:'row' }, [
            el('label', { class:'row-l' }, 'VOLUME'),
            volIn,
          ]),
          el('div', { class:'row' }, [
            el('label', { class:'row-l' }, 'TESTE'),
            el('div', { class:'row-r' }, [
              button({ label:'CRY ALEATÓRIO', kind:'ghost', onClick:()=>audio.playSfx('spawn') }),
              button({ label:'CAPTURA', kind:'ghost', onClick:()=>audio.playSfx('capture') }),
              button({ label:'BADGE', kind:'ghost', onClick:()=>audio.playSfx('badge') }),
            ]),
          ]),
        ]),
        // Account panel
        panel('◢ CONTA', [
          row('TREINADOR', save.trainer.name),
          row('E-MAIL', account.email),
          row('ID DE TREINADOR', String(save.trainer.id).padStart(5,'0')),
          row('REGIÃO ATUAL', save.trainer.region.toUpperCase()),
          row('HORAS JOGADAS', formatHours(save.trainer.hoursPlayed)),
          row('CRIADO EM', new Date(save.trainer.startedAt).toLocaleString('pt-BR')),
          el('div', { class:'row gap' }, [
            button({ label:'SAIR DA CONTA', kind:'blue', onClick: ()=>{
              Store.logout(); ctx.go('/login');
            }}),
            button({ label:'EXCLUIR CONTA', kind:'primary', onClick: async ()=>{
              const ok = await confirmModal({ title:'EXCLUIR CONTA', message:`Isso vai apagar permanentemente <b>${account.trainerName}</b> e todo o save. Tem certeza?`, confirmLabel:'EXCLUIR', cancelLabel:'CANCELAR' });
              if(ok){ Store.deleteAccount(account.email); toast('Conta excluída','info'); ctx.go('/login'); }
            }}),
          ]),
        ]),
      ]),
      panel('◢ DADOS', [
        el('p', { class:'dim' }, 'Os saves ficam no localStorage deste navegador. Para mover, exporte abaixo.'),
        el('div', { class:'row gap' }, [
          button({ label:'EXPORTAR SAVE (.JSON)', kind:'ghost', onClick: ()=>exportSave(ctx) }),
          button({ label:'IMPORTAR SAVE', kind:'ghost', onClick: ()=>importSave(ctx) }),
        ]),
      ]),
    ])
  ); }
}

function exportSave(ctx){
  const blob = new Blob([JSON.stringify({ account: ctx.account, save: ctx.save }, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `pocketquest-${ctx.account.trainerName}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Save exportado','info');
}
/* ---- FIX E: schema validation completa ao importar save ----
   Antes: aceitava qualquer JSON com `save.version` definido — um arquivo
   malformado podia corromper o save em runtime. */
function validateSaveShape(s){
  if(!s || typeof s !== 'object') return 'save nao e objeto';
  if(typeof s.version !== 'number') return 'falta save.version (numero)';
  if(!s.trainer || typeof s.trainer !== 'object') return 'falta save.trainer';
  if(typeof s.trainer.name !== 'string' || s.trainer.name.length === 0) return 'save.trainer.name invalido';
  if(typeof s.trainer.money !== 'number' || s.trainer.money < 0) return 'save.trainer.money invalido';
  if(typeof s.trainer.region !== 'string') return 'save.trainer.region invalido';
  if(!Array.isArray(s.party)) return 'save.party nao e array';
  if(s.party.length > 6) return 'save.party maior que 6';
  if(!Array.isArray(s.box)) return 'save.box nao e array';
  if(!s.bag || typeof s.bag !== 'object') return 'save.bag invalido';
  for(const cat of ['balls','medicine','ev','held','mega','zcrystal','tm']){
    if(s.bag[cat] && typeof s.bag[cat] !== 'object') return 'save.bag.'+cat+' invalido';
  }
  if(!s.pokedex || typeof s.pokedex !== 'object') return 'save.pokedex invalido';
  if(!s.pokedex.seen || typeof s.pokedex.seen !== 'object') return 'save.pokedex.seen invalido';
  if(!s.pokedex.caught || typeof s.pokedex.caught !== 'object') return 'save.pokedex.caught invalido';
  if(!s.progress || typeof s.progress !== 'object') return 'save.progress invalido';
  if(!Array.isArray(s.progress.gymsBeaten)) return 'save.progress.gymsBeaten nao e array';
  if(!Array.isArray(s.progress.trainersBeaten)) return 'save.progress.trainersBeaten nao e array';
  for(const m of s.party){
    if(!m || typeof m !== 'object') return 'mon na party invalido';
    if(typeof m.id !== 'number') return 'mon sem id numerico';
    if(typeof m.level !== 'number' || m.level < 1 || m.level > 100) return 'mon level invalido ('+m.level+')';
  }
  return null; // ok
}

function importSave(ctx){
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = async (e)=>{
    const f = e.target.files?.[0]; if(!f) return;
    if(f.size > 2 * 1024 * 1024){
      toast('Erro: arquivo maior que 2MB.', 'fail'); return;
    }
    try{
      const text = await f.text();
      const obj = JSON.parse(text);
      if(!obj || typeof obj !== 'object') throw new Error('JSON nao e objeto');
      const err = validateSaveShape(obj.save);
      if(err) throw new Error('Schema invalido: ' + err);
      Store.setSave(ctx.account.email, obj.save);
      toast('Save importado. Recarregando…','success');
      setTimeout(()=>location.reload(), 800);
    }catch(err){ toast('Erro: '+err.message,'fail'); }
  };
  input.click();
}

function header(title, sub){
  return el('div', { class:'page-head' }, [
    el('h1', {}, title),
    sub && el('p', { class:'page-sub' }, sub),
  ]);
}
function panel(title, content){
  return el('div', { class:'panel page-panel' }, [
    el('div', { class:'panel-bar' }, [ el('span',{class:'dot'}), el('span', {}, title) ]),
    el('div', { class:'panel-body' }, content),
  ]);
}
function row(label, value){
  return el('div', { class:'row' }, [
    el('span', { class:'row-l' }, label),
    el('span', { class:'row-r mono' }, String(value)),
  ]);
}
function toggleRow(label, on, fn){
  const sw = el('span', { class:'sw' });
  const t = el('div', { class:'row clickable'+(on?' on':''), onClick:()=>{
    const nowOn = !t.classList.contains('on');
    t.classList.toggle('on', nowOn);
    fn(nowOn);
  } }, [
    el('span', { class:'row-l' }, label),
    sw,
  ]);
  return t;
}
function formatHours(h){
  const min = Math.floor((h||0)*60);
  return `${Math.floor(min/60)}h ${String(min%60).padStart(2,'0')}m`;
}
