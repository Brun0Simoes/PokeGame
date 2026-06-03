/* ============================================================
   storage.js — localStorage backed accounts + per-account saves
   Designed so we can swap in a real backend later via the
   `accountStore` and `saveStore` adapters.
   ============================================================ */

import { STARTING_BAG, STARTING_MONEY } from './data.js';
import { ServerSync } from './server-sync.js';

const K_ACCOUNTS = 'pkq:v1:accounts';
const K_CURRENT  = 'pkq:v1:current';
const K_SAVE     = 'pkq:v1:save:'; // append email

/* very small non-cryptographic hash so plaintext passwords don't sit in LS */
function hash(s){
  let h = 2166136261;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = (h*16777619) >>> 0;
  }
  return h.toString(16).padStart(8,'0');
}
function pwHashFor(email, pw){ return hash(pw + ':' + String(email).toLowerCase()); }

/* ----- Debounced upload do save pro servidor -----
   `setSave` no caminho local roda sempre sync. O upload pro servidor
   acontece em background, agregando varias gravacoes proximas em uma
   so requisicao. Se cair, o jogo nao trava. */
const _syncTimers = new Map(); // email -> timeout id
function scheduleServerSync(email){
  if (!ServerSync.enabled) return;
  const key = email.toLowerCase();
  const prev = _syncTimers.get(key);
  if (prev) clearTimeout(prev);
  const t = setTimeout(async ()=>{
    _syncTimers.delete(key);
    const acc = Store.findAccount(key);
    const save = Store.getSave(key);
    if (!acc || !save || save.__placeholder) return;
    try {
      await ServerSync.putSave({ email: key, pwHash: acc.pwHash, save });
    } catch (e) {
      // 404 = sem conta no servidor (registrar agora)
      if (e.status === 404 && acc.regionId && acc.starterId){
        try {
          await ServerSync.register({
            email: key, pwHash: acc.pwHash,
            trainerName: acc.trainerName,
            regionId: acc.regionId, starterId: acc.starterId,
            save,
          });
        } catch (e2) { console.warn('server register fallback falhou:', e2.message); }
      } else {
        console.warn('save sync falhou:', e.message || e);
      }
    }
  }, 4000);
  _syncTimers.set(key, t);
}

function readJson(k, fallback){
  try{ const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; }
  catch{ return fallback; }
}
function writeJson(k, v){
  try{
    localStorage.setItem(k, JSON.stringify(v));
  }catch(e){
    // Quota exceeded: the PokéAPI sprite/JSON cache is rebuildable, so
    // evict it and retry once before giving up — protects player saves.
    try{
      for(const key of Object.keys(localStorage)){
        if(/^pkq:apicache|^pkq:cache/.test(key)) localStorage.removeItem(key);
      }
      localStorage.setItem(k, JSON.stringify(v));
    }catch(e2){
      console.warn('LS write falhou (cota cheia):', e2);
    }
  }
}

export const Store = {
  /* -------- account roster -------- */
  listAccounts(){
    return readJson(K_ACCOUNTS, []);
  },
  findAccount(email){
    return this.listAccounts().find(a=>a.email.toLowerCase()===email.toLowerCase()) || null;
  },
  createAccount({ email, password, trainerName, regionId, starterId }){
    if(!email || !password || !trainerName || !regionId || !starterId) throw new Error('Campos obrigatórios faltando.');
    if(this.findAccount(email)) throw new Error('Já existe uma conta com esse e-mail.');
    const accounts = this.listAccounts();
    const acc = {
      email: email.toLowerCase(),
      pwHash: hash(password + ':' + email.toLowerCase()),
      trainerName: trainerName.slice(0, 14),
      regionId,
      starterId,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
    accounts.push(acc);
    writeJson(K_ACCOUNTS, accounts);
    return acc;
  },
  login(email, password){
    const acc = this.findAccount(email);
    if(!acc) throw new Error('Conta não encontrada.');
    if(acc.pwHash !== hash(password + ':' + acc.email)) throw new Error('Senha incorreta.');
    acc.lastLogin = Date.now();
    const all = this.listAccounts().map(a => a.email===acc.email ? acc : a);
    writeJson(K_ACCOUNTS, all);
    writeJson(K_CURRENT, acc.email);
    return acc;
  },
  logout(){
    localStorage.removeItem(K_CURRENT);
  },
  currentEmail(){
    return readJson(K_CURRENT, null);
  },
  currentAccount(){
    const email = this.currentEmail();
    return email ? this.findAccount(email) : null;
  },
  deleteAccount(email){
    const accounts = this.listAccounts().filter(a => a.email !== email.toLowerCase());
    writeJson(K_ACCOUNTS, accounts);
    localStorage.removeItem(K_SAVE + email.toLowerCase());
    if(this.currentEmail()===email.toLowerCase()) localStorage.removeItem(K_CURRENT);
  },

  /* -------- per-account save -------- */
  getSave(email){
    return readJson(K_SAVE + email.toLowerCase(), null);
  },
  setSave(email, save){
    writeJson(K_SAVE + email.toLowerCase(), save);
    scheduleServerSync(email.toLowerCase());
  },

  /* -------- Sync com servidor (cross-device) -------- */

  // Helper: monta o pwHash que o servidor espera.
  pwHashFor(email, password){ return pwHashFor(email, password); },

  // Tenta criar conta + save no servidor agora (sem debounce).
  // Idempotente: 409 (ja existe) eh tratado como sucesso silencioso.
  async serverRegister(email, password){
    if (!ServerSync.enabled) return { skipped:true };
    const em = email.toLowerCase();
    const acc = this.findAccount(em);
    const save = this.getSave(em);
    if (!acc || !save) throw new Error('Conta/save local nao existem.');
    try {
      return await ServerSync.register({
        email: em,
        pwHash: acc.pwHash,
        trainerName: acc.trainerName,
        regionId: acc.regionId, starterId: acc.starterId,
        save,
      });
    } catch (e) {
      if (e.status === 409) return { ok:true, existed:true };
      throw e;
    }
  },

  // Login remoto: baixa save do servidor e materializa conta local.
  // Lanca erro com `.status` (404 = nao existe, 401 = senha errada).
  async serverLogin(email, password){
    if (!ServerSync.enabled) throw new Error('Sync indisponivel.');
    const em = email.toLowerCase();
    const pwHash = pwHashFor(em, password);
    const res = await ServerSync.login({ email: em, pwHash });
    const accounts = this.listAccounts();
    const existing = this.findAccount(em);
    const accRec = {
      email: em,
      pwHash, // local pwHash (mesmo formato de createAccount)
      trainerName: res.account.trainerName,
      regionId:    res.account.regionId,
      starterId:   res.account.starterId,
      createdAt:   existing?.createdAt || Date.now(),
      lastLogin:   Date.now(),
    };
    if (existing){
      const updated = accounts.map(a => a.email === em ? accRec : a);
      writeJson(K_ACCOUNTS, updated);
    } else {
      accounts.push(accRec);
      writeJson(K_ACCOUNTS, accounts);
    }
    // grava save sem disparar sync (acabamos de baixar dele)
    writeJson(K_SAVE + em, res.save);
    writeJson(K_CURRENT, em);
    return accRec;
  },
};

/* ============================================================
   Save shape — created fresh on first onboarding
   ============================================================ */
export function newSave({ trainerName, regionId, starter }){
  return {
    version: 1,
    trainer: {
      name: trainerName,
      id: 1 + Math.floor(Math.random()*99998),
      money: STARTING_MONEY,
      region: regionId,
      hoursPlayed: 0,
      startedAt: Date.now(),
      lastPlayed: Date.now(),
    },
    party:   [ starter ],      // mon objects
    box:     [],               // unlimited storage
    bag: {
      balls:    { ...STARTING_BAG.balls },
      medicine: { ...STARTING_BAG.medicine },
      ev:       { ...STARTING_BAG.ev },
      held:     { ...STARTING_BAG.held },
      mega:     { ...STARTING_BAG.mega },
      zcrystal: { ...STARTING_BAG.zcrystal },
      tm:       { ...STARTING_BAG.tm },
      evo:      { ...(STARTING_BAG.evo||{}) },
      key:      [ ...STARTING_BAG.key ],
    },
    pokedex: { seen:{}, caught:{} },  // id -> { name, types, sprite, caughtAt }
    progress: {
      gymsBeaten:     [],
      trainersBeaten: [],
      elite4Cleared:  false,
      championBeaten: false,
      currentGym:     0, // index into region's gym array
    },
    settings: { music:false, sfx:true, volume:0.5 },
  };
}
