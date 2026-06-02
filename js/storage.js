/* ============================================================
   storage.js — localStorage backed accounts + per-account saves
   Designed so we can swap in a real backend later via the
   `accountStore` and `saveStore` adapters.
   ============================================================ */

import { STARTING_BAG, STARTING_MONEY } from './data.js';

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
