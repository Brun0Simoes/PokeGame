# Servidor multiplayer — guia de integração

O jogo já funciona offline com um **lobby simulado** (`js/tabs/online.js`)
e um adaptador de rede plugável (`js/net.js`). Para multiplayer real entre
dispositivos diferentes, basta subir um servidor WebSocket e trocar a config.

## 1. Ativar o modo online no cliente

Em `js/net.js`, ajuste:

```js
export const NET_CONFIG = {
  mode: 'socket',                 // mude de 'local' para 'socket'
  url:  'wss://SEU-SERVIDOR/pkq', // endereço do seu WebSocket
  heartbeatMs: 4000,
  onlineWindowMs: 12000,
};
```

Nenhuma outra mudança de UI é necessária — o lobby lê do mesmo `Net`.

## 2. Protocolo de mensagens (JSON)

**Cliente → servidor**

| `t`        | payload                                             |
|------------|-----------------------------------------------------|
| `hello`    | `{ me:{ email, name, region, level, party, badges } }` |
| `beat`     | `{ me:{...} }` (heartbeat a cada ~4s)               |
| `bye`      | —                                                   |
| `invite`   | `{ to, battleId }`                                  |
| `accept`   | `{ to, battleId }`                                  |
| `decline`  | `{ to, battleId }`                                  |
| `team`     | `{ to, battleId, team:[{id,lvl,...}] }`             |
| `move`     | `{ to, battleId, action:{...} }` (sync de turnos)   |

**Servidor → cliente**

| `t`        | payload                                             |
|------------|-----------------------------------------------------|
| `presence` | `{ players:[{ email,name,region,level,party,badges,ts }] }` |
| `invite`   | `{ from:<player>, battleId }`                       |
| `accept`   | `{ from, battleId }`                                |
| `decline`  | `{ from, battleId }`                                |
| `team`     | `{ from, battleId, team:[...] }`                    |
| `move`     | `{ from, battleId, action:{...} }`                  |

## 3. Servidor de referência (Node.js + `ws`)

```js
// server.js — node >=18, `npm i ws`
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map(); // email -> { ws, me }

function broadcastPresence() {
  const players = [...clients.values()].map(c => ({ ...c.me, ts: Date.now() }));
  const msg = JSON.stringify({ t: 'presence', players });
  for (const { ws } of clients.values()) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}
function sendTo(email, msg) {
  const c = clients.get(email);
  if (c && c.ws.readyState === c.ws.OPEN) c.ws.send(JSON.stringify(msg));
}

wss.on('connection', (ws) => {
  let email = null;
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    switch (m.t) {
      case 'hello':
      case 'beat':
        email = m.me.email;
        clients.set(email, { ws, me: m.me });
        broadcastPresence();
        break;
      case 'invite':  sendTo(m.to, { t: 'invite',  from: clients.get(email)?.me, battleId: m.battleId }); break;
      case 'accept':  sendTo(m.to, { t: 'accept',  from: email, battleId: m.battleId }); break;
      case 'decline': sendTo(m.to, { t: 'decline', from: email, battleId: m.battleId }); break;
      case 'team':    sendTo(m.to, { t: 'team',    from: email, battleId: m.battleId, team: m.team }); break;
      case 'move':    sendTo(m.to, { t: 'move',    from: email, battleId: m.battleId, action: m.action }); break;
      case 'bye':     if (email) clients.delete(email); broadcastPresence(); break;
    }
  });
  ws.on('close', () => { if (email) clients.delete(email); broadcastPresence(); });
});

console.log('Liga Online server on ws://localhost:8080');
```

Rodar local: `node server.js` e use `url: 'ws://localhost:8080'`.

## 4. Fluxo de uma batalha online

1. Ambos enviam `hello`/`beat` → todos recebem `presence`.
2. Jogador A envia `invite { to:B }`.
3. B recebe `invite`, responde `accept` (ou `decline`).
4. Cada lado envia `team` com sua party.
5. (Opcional) sincronizar turnos com `move` — hoje o cliente resolve a
   batalha localmente contra a `team` recebida; para um motor autoritativo,
   mova o cálculo de dano para o servidor e troque só ações via `move`.

## 5. Pontos de extensão sugeridos
- **Autenticação real**: substituir o `email` do save por um token JWT.
- **Persistência**: salvar perfis/ranking num banco (Postgres/Redis).
- **Anti-trapaça**: validar `team` (níveis, espécies) no servidor.
- **Matchmaking**: fila por faixa de nível em vez de convite manual.
- **Reconexão**: reenviar `hello` no `onclose` com backoff.
