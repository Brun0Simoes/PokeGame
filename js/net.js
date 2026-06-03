/* ============================================================
   net.js — pluggable network adapter for online multiplayer
   ------------------------------------------------------------
   The Liga Online tab talks to ONE of two transports:

     • LocalTransport  (default) — localStorage heartbeats, so
       accounts in the SAME browser see each other. No server.

     • SocketTransport — a real WebSocket backend. Flip
       NET_CONFIG.mode to 'socket' and set the URL to go live
       across devices. The message protocol is documented below
       and implemented by the reference server in SERVER.md.

   The rest of the game imports `Net` and never cares which
   transport is active.
   ============================================================ */

// URL pode ser sobrescrita em runtime via `localStorage.setItem('pkq:wsUrl', '...')`
// (util para trocar de tunel sem novo deploy).
const DEFAULT_URL = 'wss://wilhelmina-calvus-overmellowly.ngrok-free.dev/?token=5c06408b9c6f75dd4e6e9fe2a3200e3dd5e1cd02da8b0e818fec50a35138b942';
let _overrideUrl = null;
try { _overrideUrl = localStorage.getItem('pkq:wsUrl'); } catch {}

export const NET_CONFIG = {
  mode: 'socket',                 // 'local' | 'socket'
  url: _overrideUrl || DEFAULT_URL,
  heartbeatMs: 4000,
  onlineWindowMs: 12000,
};

/* ------------------------------------------------------------
   WIRE PROTOCOL (client <-> server), JSON messages:

   → client sends:
     { t:'hello',   me:{ email, name, region, level, party, badges } }
     { t:'beat',    me:{ ... } }                     // heartbeat
     { t:'bye' }
     { t:'invite',  to:<email>, battleId:<uuid> }
     { t:'accept',  to:<email>, battleId }
     { t:'decline', to:<email>, battleId }
     { t:'team',    to:<email>, battleId, team:[{id,lvl,...}] }
     { t:'move',    to:<email>, battleId, action:{...} }   // turn sync (future)

   ← server sends:
     { t:'presence', players:[{ email,name,region,level,party,badges,ts }] }
     { t:'invite',   from:<player>, battleId }
     { t:'accept',   from:<email>, battleId }
     { t:'decline',  from:<email>, battleId }
     { t:'team',     from:<email>, battleId, team:[...] }
     { t:'move',     from:<email>, battleId, action:{...} }
   ------------------------------------------------------------ */

/* ---- Local transport: localStorage presence ---- */
class LocalTransport {
  constructor(cfg){ this.cfg = cfg; this.KEY='pkq:presence:v1'; this.handlers={}; this._me=null; }
  on(type, fn){ (this.handlers[type] ||= []).push(fn); }
  _emit(type, msg){ (this.handlers[type]||[]).forEach(fn=>fn(msg)); }
  _read(){ try{ return JSON.parse(localStorage.getItem(this.KEY)||'{}'); }catch{ return {}; } }
  _write(o){ try{ localStorage.setItem(this.KEY, JSON.stringify(o)); }catch{} }
  connect(me){ this._me = me; this.hello(me); this._poll(); }
  hello(me){ this.beat(me); }
  beat(me){
    this._me = me;
    const o = this._read();
    o[me.email] = { ...me, ts: Date.now() };
    this._write(o);
    this._poll();
  }
  _poll(){
    const o = this._read(); const now = Date.now();
    const players = Object.values(o).filter(p => now - p.ts < this.cfg.onlineWindowMs);
    this._emit('presence', { players });
  }
  // invites are simulated locally (the lobby handles bot acceptance)
  send(){ /* no-op for local; lobby simulates opponent replies */ }
  disconnect(){ if(this._me){ const o=this._read(); delete o[this._me.email]; this._write(o); } }
}

/* ---- Socket transport: real WebSocket backend ---- */
class SocketTransport {
  constructor(cfg){ this.cfg = cfg; this.handlers={}; this.ws=null; this._me=null; this._queue=[]; }
  on(type, fn){ (this.handlers[type] ||= []).push(fn); }
  _emit(type, msg){ (this.handlers[type]||[]).forEach(fn=>fn(msg)); }
  connect(me){
    this._me = me;
    this.ws = new WebSocket(this.cfg.url);
    this.ws.addEventListener('open', ()=>{
      this._raw({ t:'hello', me });
      this._queue.forEach(m=>this._raw(m)); this._queue=[];
    });
    this.ws.addEventListener('message', e=>{
      let msg; try{ msg = JSON.parse(e.data); }catch{ return; }
      if(msg && msg.t) this._emit(msg.t, msg);
    });
    this.ws.addEventListener('close', ()=> this._emit('disconnected', {}));
    this.ws.addEventListener('error', ()=> this._emit('error', {}));
  }
  _raw(m){
    if(this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
    else this._queue.push(m);
  }
  hello(me){ this._raw({ t:'hello', me }); }
  beat(me){ this._me = me; this._raw({ t:'beat', me }); }
  send(msg){ this._raw(msg); }   // invite/accept/decline/team/move
  disconnect(){ this._raw({ t:'bye' }); try{ this.ws && this.ws.close(); }catch{} }
}

/* ---- Public Net facade ---- */
function makeTransport(){
  return NET_CONFIG.mode === 'socket'
    ? new SocketTransport(NET_CONFIG)
    : new LocalTransport(NET_CONFIG);
}

export const Net = {
  _t: null,
  get transport(){ return (this._t ||= makeTransport()); },
  isOnlineMode(){ return NET_CONFIG.mode === 'socket'; },
  connect(me){ this.transport.connect(me); },
  beat(me){ this.transport.beat(me); },
  on(type, fn){ this.transport.on(type, fn); },
  send(msg){ this.transport.send(msg); },
  disconnect(){ this.transport.disconnect(); },
};
