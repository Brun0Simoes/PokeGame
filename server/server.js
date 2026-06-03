/* ============================================================
   pkq-server — WebSocket backend para a Liga Online
   ------------------------------------------------------------
   Implementa o protocolo descrito em SERVER.md com camadas de
   seguranca adicionais para uso atras de um tunel HTTPS quando
   o cliente esta hospedado no GitHub Pages.

   Camadas de seguranca:
     - Allowlist de Origin (rejeita upgrade de origens nao listadas)
     - Token compartilhado opcional via query string `?token=...`
     - Limite de conexoes simultaneas por IP
     - Limite de tamanho de mensagem (maxPayload)
     - Rate limiting token-bucket por conexao
     - Validacao estrita de schema por tipo de mensagem
     - Heartbeat ping/pong (drop de conexoes mortas)
     - TLS direto se TLS_CERT_PATH + TLS_KEY_PATH estiverem setados
     - Shutdown gracioso em SIGINT/SIGTERM
   ============================================================ */

import 'dotenv/config';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { WebSocketServer } from 'ws';

/* ---------- Config ---------- */
const PORT                 = parseInt(process.env.PORT || '8080', 10);
const ALLOWED_ORIGINS      = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
const AUTH_TOKEN           = process.env.AUTH_TOKEN || '';
const MAX_CONN_PER_IP      = parseInt(process.env.MAX_CONNECTIONS_PER_IP || '8', 10);
const MAX_MESSAGE_BYTES    = parseInt(process.env.MAX_MESSAGE_BYTES   || '65536', 10);
const RATE_LIMIT_PER_SEC   = parseInt(process.env.RATE_LIMIT_PER_SEC  || '30', 10);
const HEARTBEAT_MS         = parseInt(process.env.HEARTBEAT_MS         || '30000', 10);
const TLS_CERT_PATH        = process.env.TLS_CERT_PATH || '';
const TLS_KEY_PATH         = process.env.TLS_KEY_PATH  || '';

/* ---------- HTTP(S) ---------- */
const usingTls = TLS_CERT_PATH && TLS_KEY_PATH;
const httpServer = usingTls
  ? createHttpsServer({
      cert: readFileSync(TLS_CERT_PATH),
      key:  readFileSync(TLS_KEY_PATH),
    })
  : createHttpServer();

// Rota simples para health-check (uteis para tuneis / load balancers).
httpServer.on('request', (req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      service: 'pkq-server',
      clients: clients.size,
      uptimeSec: Math.round(process.uptime()),
    }));
    return;
  }
  res.writeHead(404); res.end();
});

/* ---------- WS server ----------
   `noServer: true` => fazemos o handshake manual e validamos o Origin
   antes de aceitar o upgrade. Mais seguro do que aceitar tudo. */
const wss = new WebSocketServer({
  noServer: true,
  maxPayload: MAX_MESSAGE_BYTES,
  perMessageDeflate: false, // evita compress-bomb e overhead em msgs pequenas
});

/* ---------- Estado ---------- */
/** email -> { ws, me, ip } */
const clients     = new Map();
/** ip    -> int (qtd conexoes ativas)         */
const connsByIp   = new Map();

/* ---------- Utils ---------- */
function clientIp(req) {
  // confia em X-Forwarded-For quando atras de um tunel/proxy
  const xf = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.socket.remoteAddress || 'unknown';
}

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function send(ws, obj) {
  if (ws.readyState !== ws.OPEN) return;
  try { ws.send(JSON.stringify(obj)); } catch (err) { log('send err', err.message); }
}

function sendTo(email, obj) {
  const c = clients.get(email);
  if (c) send(c.ws, obj);
}

function broadcastPresence() {
  const players = [...clients.values()].map(c => ({ ...c.me, ts: Date.now() }));
  const msg = JSON.stringify({ t: 'presence', players });
  for (const { ws } of clients.values()) {
    if (ws.readyState === ws.OPEN) {
      try { ws.send(msg); } catch {}
    }
  }
}

/* ---------- Validacao de mensagens ----------
   Cada caso retorna `null` se ok, ou string com motivo do erro. */
function validate(msg) {
  if (!msg || typeof msg !== 'object') return 'not-object';
  if (typeof msg.t !== 'string')        return 'no-type';

  const okEmail = (e) => typeof e === 'string' && e.length > 0 && e.length <= 254;
  const okStr   = (s, max) => typeof s === 'string' && s.length <= max;
  const okMe    = (me) => {
    if (!me || typeof me !== 'object') return false;
    if (!okEmail(me.email)) return false;
    if (me.name && !okStr(me.name, 64))   return false;
    if (me.region && !okStr(me.region, 32)) return false;
    if (me.level != null && typeof me.level !== 'number') return false;
    if (me.party != null && typeof me.party !== 'number') return false;
    if (me.badges != null && typeof me.badges !== 'number') return false;
    return true;
  };

  switch (msg.t) {
    case 'hello':
    case 'beat':
      return okMe(msg.me) ? null : 'bad-me';
    case 'bye':
      return null;
    case 'invite':
    case 'accept':
    case 'decline':
      if (!okEmail(msg.to)) return 'bad-to';
      if (!okStr(msg.battleId || '', 64)) return 'bad-battleId';
      return null;
    case 'team':
      if (!okEmail(msg.to)) return 'bad-to';
      if (!Array.isArray(msg.team) || msg.team.length > 6) return 'bad-team';
      return null;
    case 'move':
      if (!okEmail(msg.to)) return 'bad-to';
      if (!msg.action || typeof msg.action !== 'object') return 'bad-action';
      return null;
    default:
      return 'unknown-type';
  }
}

/* ---------- Handshake (upgrade) ----------
   Valida Origin e token ANTES de aceitar a conexao. */
httpServer.on('upgrade', (req, socket, head) => {
  const ip = clientIp(req);

  // 1) Origin allowlist
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
    log('reject origin', origin, 'from', ip);
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return;
  }

  // 2) Token (se configurado)
  if (AUTH_TOKEN) {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.searchParams.get('token') !== AUTH_TOKEN) {
        log('reject token from', ip);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); socket.destroy(); return;
      }
    } catch {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n'); socket.destroy(); return;
    }
  }

  // 3) Limite por IP
  const cur = connsByIp.get(ip) || 0;
  if (cur >= MAX_CONN_PER_IP) {
    log('reject too-many-from-ip', ip);
    socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n'); socket.destroy(); return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    ws._ip = ip;
    connsByIp.set(ip, cur + 1);
    wss.emit('connection', ws, req);
  });
});

/* ---------- Conexao ---------- */
wss.on('connection', (ws, req) => {
  let email = null;
  let bucket = RATE_LIMIT_PER_SEC; // token bucket
  const bucketTimer = setInterval(() => {
    bucket = Math.min(RATE_LIMIT_PER_SEC, bucket + RATE_LIMIT_PER_SEC);
  }, 1000);

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw, isBinary) => {
    if (isBinary) { ws.close(1003, 'binary not supported'); return; }
    if (raw.length > MAX_MESSAGE_BYTES) { ws.close(1009, 'message too large'); return; }
    if (--bucket < 0) { ws.close(1008, 'rate limit'); return; }

    let m;
    try { m = JSON.parse(raw.toString('utf8')); }
    catch { return; }

    const err = validate(m);
    if (err) { log('invalid msg', err, 'from', email || ws._ip); return; }

    switch (m.t) {
      case 'hello':
      case 'beat': {
        // se ja existia outra conexao para esse email, fecha a antiga
        if (email && email !== m.me.email) {
          const old = clients.get(email);
          if (old && old.ws !== ws) try { old.ws.close(1000, 'replaced'); } catch {}
        }
        email = m.me.email;
        clients.set(email, { ws, me: m.me, ip: ws._ip });
        broadcastPresence();
        break;
      }
      case 'invite':
        sendTo(m.to, { t: 'invite',  from: clients.get(email)?.me, battleId: m.battleId });
        break;
      case 'accept':
        sendTo(m.to, { t: 'accept',  from: email, battleId: m.battleId });
        break;
      case 'decline':
        sendTo(m.to, { t: 'decline', from: email, battleId: m.battleId });
        break;
      case 'team':
        sendTo(m.to, { t: 'team',    from: email, battleId: m.battleId, team: m.team });
        break;
      case 'move':
        sendTo(m.to, { t: 'move',    from: email, battleId: m.battleId, action: m.action });
        break;
      case 'bye':
        if (email) { clients.delete(email); broadcastPresence(); }
        try { ws.close(1000, 'bye'); } catch {}
        break;
    }
  });

  ws.on('close', () => {
    clearInterval(bucketTimer);
    const ip = ws._ip;
    if (ip) {
      const n = (connsByIp.get(ip) || 1) - 1;
      if (n <= 0) connsByIp.delete(ip); else connsByIp.set(ip, n);
    }
    if (email && clients.get(email)?.ws === ws) {
      clients.delete(email);
      broadcastPresence();
    }
  });

  ws.on('error', (err) => log('ws error', err.message));
});

/* ---------- Heartbeat: drop conexoes mortas ---------- */
const hbTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { try { ws.terminate(); } catch {} continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  }
}, HEARTBEAT_MS);

/* ---------- Shutdown gracioso ---------- */
function shutdown(sig) {
  log('shutdown', sig);
  clearInterval(hbTimer);
  for (const { ws } of clients.values()) {
    try { ws.close(1001, 'server going down'); } catch {}
  }
  wss.close(() => httpServer.close(() => process.exit(0)));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

/* ---------- Start ---------- */
httpServer.listen(PORT, () => {
  const scheme = usingTls ? 'wss' : 'ws';
  log(`pkq-server up on ${scheme}://localhost:${PORT}`);
  log(`origins  : ${ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.join(', ') : '(ANY — INSEGURO, defina ALLOWED_ORIGINS)'}`);
  log(`auth     : ${AUTH_TOKEN ? 'token requerido' : '(sem token — apenas allowlist de origin)'}`);
  log(`limits   : ${MAX_CONN_PER_IP}/IP, ${RATE_LIMIT_PER_SEC} msg/s, ${MAX_MESSAGE_BYTES}B/msg`);
});
