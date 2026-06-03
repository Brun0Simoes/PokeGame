/* ============================================================
   server-sync.js — HTTP client para sync de save no pkq-server
   ------------------------------------------------------------
   Deriva a URL HTTP do `NET_CONFIG.url` (mesmo host do WSS) e
   chama os endpoints /api/register, /api/login, /api/save.
   Tudo eh fire-and-forget no caminho de escrita: se o servidor
   esta fora, o jogo continua local sem travar.
   ============================================================ */

import { NET_CONFIG } from './net.js';

function deriveEndpoint(){
  try {
    const wsUrl = NET_CONFIG.url || '';
    if (!wsUrl) return { base: '', token: '' };
    // troca wss:// por https:// e ws:// por http://
    const httpUrl = wsUrl.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
    const u = new URL(httpUrl);
    const token = u.searchParams.get('token') || '';
    return { base: `${u.protocol}//${u.host}`, token };
  } catch {
    return { base: '', token: '' };
  }
}

const { base, token } = deriveEndpoint();

async function call(path, body, { timeoutMs = 8000 } = {}){
  if (!base) throw new Error('sync-disabled');
  const headers = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = 'Bearer ' + token;
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(base + path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: ctrl.signal,
      mode: 'cors',
      credentials: 'omit',
    });
    let data = null;
    try { data = await r.json(); } catch {}
    if (!r.ok) {
      const err = new Error((data && data.error) || ('http-' + r.status));
      err.status = r.status;
      throw err;
    }
    return data || {};
  } finally {
    clearTimeout(timer);
  }
}

export const ServerSync = {
  get enabled(){ return !!base && NET_CONFIG.mode === 'socket'; },
  get base(){ return base; },

  // Cria conta + save iniciais. Se a conta ja existe no servidor, retorna 409.
  async register({ email, pwHash, trainerName, regionId, starterId, save }){
    return call('/api/register', { email, pwHash, trainerName, regionId, starterId, save });
  },

  // Faz login. 404 = conta nao existe, 401 = senha errada.
  async login({ email, pwHash }){
    return call('/api/login', { email, pwHash });
  },

  // Atualiza o save. 404 = sem conta no servidor (precisa register), 401 = senha.
  async putSave({ email, pwHash, save }){
    return call('/api/save', { email, pwHash, save });
  },
};
