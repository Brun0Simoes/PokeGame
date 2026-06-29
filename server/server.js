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
import { readFileSync, mkdirSync, createReadStream } from 'node:fs';
import { promises as fsp } from 'node:fs';
import { createHash } from 'node:crypto';
import { join as pathJoin, normalize as pathNormalize, resolve as pathResolve, extname as pathExtname } from 'node:path';
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

/* ---------- Sync de save (HTTP) ---------- */
const SAVE_DIR             = process.env.SAVE_DIR     || './saves';
const SERVER_PEPPER        = process.env.SERVER_PEPPER || '';
const MAX_BODY_BYTES       = parseInt(process.env.MAX_BODY_BYTES || '524288', 10); // 512KB
mkdirSync(SAVE_DIR, { recursive: true });

/* ---------- Static (serve a propria pagina do jogo) ----------
   Se STATIC_DIR aponta para a raiz do jogo (index.html, css/, js/...),
   o servidor responde a pagina E o backend no mesmo origin. Deixe
   vazio para desativar (modo so-API, como no GitHub Pages). */
const STATIC_DIR = process.env.STATIC_DIR
  ? pathResolve(process.env.STATIC_DIR)
  : '';
const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.gif':'image/gif', '.webp':'image/webp', '.ico':'image/x-icon',
  '.ogg':'audio/ogg', '.mp3':'audio/mpeg', '.woff':'font/woff', '.woff2':'font/woff2',
  '.map':'application/json; charset=utf-8', '.txt':'text/plain; charset=utf-8',
  '.md':'text/markdown; charset=utf-8',
};

async function serveStatic(req, res) {
  if (!STATIC_DIR) { res.writeHead(404); res.end(); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  // remove query string e decodifica
  let urlPath = decodeURIComponent((req.url.split('?')[0] || '/'));
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  // guard contra path traversal: resolve e confirma que fica dentro de STATIC_DIR
  const filePath = pathNormalize(pathJoin(STATIC_DIR, urlPath));
  if (!filePath.startsWith(STATIC_DIR)) { res.writeHead(403); res.end(); return; }
  try {
    const st = await fsp.stat(filePath);
    if (st.isDirectory()) { res.writeHead(403); res.end(); return; }
    const type = MIME[pathExtname(filePath).toLowerCase()] || 'application/octet-stream';
    // sw.js e index nunca devem ser cacheados de forma agressiva
    const noCache = /(\\|\/)(sw\.js|index\.html)$/i.test(filePath);
    res.writeHead(200, {
      'content-type': type,
      'content-length': st.size,
      'cache-control': noCache ? 'no-cache' : 'public, max-age=300',
    });
    if (req.method === 'HEAD') { res.end(); return; }
    createReadStream(filePath).pipe(res);
  } catch {
    // arquivo nao existe: serve index.html (a rota de jogo usa hash, mas
    // links diretos a #/... ja batem em '/'); senao 404.
    if (pathExtname(filePath)) { res.writeHead(404); res.end(); return; }
    try {
      const idx = pathJoin(STATIC_DIR, 'index.html');
      const data = await fsp.readFile(idx);
      res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-cache' });
      res.end(data);
    } catch { res.writeHead(404); res.end(); }
  }
}

function emailKey(email)            { return createHash('sha256').update(String(email).toLowerCase()).digest('hex'); }
function serverHash(clientHash, em) { return createHash('sha256').update(String(clientHash) + ':' + String(em).toLowerCase() + ':' + SERVER_PEPPER).digest('hex'); }
function safeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0; for (let i=0;i<a.length;i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function readSaveRecord(email) {
  try {
    const data = await fsp.readFile(pathJoin(SAVE_DIR, emailKey(email) + '.json'), 'utf8');
    return JSON.parse(data);
  } catch { return null; }
}
async function writeSaveRecord(email, record) {
  const file = pathJoin(SAVE_DIR, emailKey(email) + '.json');
  const tmp  = file + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(record));
  await fsp.rename(tmp, file);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0; const chunks = [];
    req.on('data', c => {
      total += c.length;
      if (total > MAX_BODY_BYTES) { req.destroy(); reject(new Error('too-large')); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('bad-json')); }
    });
    req.on('error', reject);
  });
}
function jsonRes(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(obj));
}

/* ---------- HTTP(S) ---------- */
const usingTls = TLS_CERT_PATH && TLS_KEY_PATH;
const httpServer = usingTls
  ? createHttpsServer({
      cert: readFileSync(TLS_CERT_PATH),
      key:  readFileSync(TLS_KEY_PATH),
    })
  : createHttpServer();

httpServer.on('request', async (req, res) => {
  // ----- CORS -----
  const origin = req.headers.origin || '';
  if (origin) {
    if (ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
      res.writeHead(403); res.end(); return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ----- health -----
  if (req.url === '/health') {
    return jsonRes(res, 200, {
      ok: true,
      service: 'pkq-server',
      clients: clients.size,
      uptimeSec: Math.round(process.uptime()),
    });
  }

  // ----- /api/* -----
  if (req.url.startsWith('/api/')) {
    // Bearer gateway token
    if (AUTH_TOKEN) {
      const auth = req.headers.authorization || '';
      if (!safeEq(auth, 'Bearer ' + AUTH_TOKEN)) {
        return jsonRes(res, 401, { error: 'unauthorized' });
      }
    }
    try {
      const body = req.method === 'POST' ? await readBody(req) : {};
      const { email, pwHash } = body || {};

      // ----- POST /api/register -----
      if (req.url === '/api/register' && req.method === 'POST') {
        const { trainerName, regionId, starterId, save } = body || {};
        if (!email || !pwHash || !trainerName || !regionId || !starterId || !save) {
          return jsonRes(res, 400, { error: 'missing-fields' });
        }
        if (typeof email !== 'string' || email.length > 254) return jsonRes(res, 400, { error: 'bad-email' });
        if (typeof pwHash !== 'string' || pwHash.length > 256) return jsonRes(res, 400, { error: 'bad-pwhash' });
        const existing = await readSaveRecord(email);
        if (existing) return jsonRes(res, 409, { error: 'exists' });
        const now = Date.now();
        const record = {
          email: email.toLowerCase(),
          pwHash: serverHash(pwHash, email),
          trainerName: String(trainerName).slice(0, 32),
          regionId, starterId, save,
          createdAt: now, updatedAt: now,
        };
        await writeSaveRecord(email, record);
        log('register', record.email);
        return jsonRes(res, 200, {
          ok: true,
          account: { email: record.email, trainerName: record.trainerName, regionId, starterId },
          updatedAt: record.updatedAt,
        });
      }

      // ----- POST /api/login -----
      if (req.url === '/api/login' && req.method === 'POST') {
        if (!email || !pwHash) return jsonRes(res, 400, { error: 'missing-fields' });
        const record = await readSaveRecord(email);
        if (!record) return jsonRes(res, 404, { error: 'not-found' });
        if (!safeEq(record.pwHash, serverHash(pwHash, email))) {
          return jsonRes(res, 401, { error: 'invalid' });
        }
        log('login', record.email);
        return jsonRes(res, 200, {
          ok: true,
          account: {
            email: record.email,
            trainerName: record.trainerName,
            regionId: record.regionId,
            starterId: record.starterId,
          },
          save: record.save,
          updatedAt: record.updatedAt,
        });
      }

      // ----- POST /api/save -----
      if (req.url === '/api/save' && req.method === 'POST') {
        const { save } = body || {};
        if (!email || !pwHash || !save) return jsonRes(res, 400, { error: 'missing-fields' });
        const record = await readSaveRecord(email);
        if (!record) return jsonRes(res, 404, { error: 'not-found' });
        if (!safeEq(record.pwHash, serverHash(pwHash, email))) {
          return jsonRes(res, 401, { error: 'invalid' });
        }
        record.save = save;
        record.updatedAt = Date.now();
        await writeSaveRecord(email, record);
        return jsonRes(res, 200, { ok: true, updatedAt: record.updatedAt });
      }

      return jsonRes(res, 404, { error: 'no-such-endpoint' });
    } catch (e) {
      log('api err', req.url, e.message);
      const status = e.message === 'too-large' ? 413 : (e.message === 'bad-json' ? 400 : 500);
      return jsonRes(res, status, { error: e.message });
    }
  }

  // ----- estaticos (a propria pagina do jogo, se STATIC_DIR setado) -----
  return serveStatic(req, res);
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
        // PHASE 3: forward seed (PvP deterministic RNG) se presente
        sendTo(m.to, { t: 'team', from: email, battleId: m.battleId, team: m.team, seed: m.seed });
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
