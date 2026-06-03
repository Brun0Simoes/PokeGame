# pkq-server — backend WebSocket para a Liga Online

Servidor de presence + relay de mensagens para o **Pocket AR Encounter**.
Implementa o protocolo descrito em [`../SERVER.md`](../SERVER.md) com
camadas extras de segurança para uso em produção com o cliente hospedado
no **GitHub Pages**.

```
   navegador (https://Brun0Simoes.github.io/PokeGame/)
        │
        │  wss://  (criptografado fim-a-fim)
        ▼
   Cloudflare Tunnel  (TLS publico + URL fixa)
        │
        │  ws://127.0.0.1:8080
        ▼
   pkq-server  (sua maquina local)
```

> **Por que um túnel?** O GitHub Pages serve HTTPS. O navegador bloqueia
> qualquer WebSocket inseguro (`ws://`) saindo de uma página HTTPS
> (*mixed-content*). Você tem três opções:
> 1. **Túnel HTTPS gerenciado (recomendado)** — Cloudflare Tunnel,
>    gratuito, URL persistente, TLS automático. Veja seção 3.
> 2. **TLS direto na sua máquina** — você gera certificado (Let's Encrypt
>    com seu domínio) e abre porta no roteador. Mais trabalho, exige
>    domínio próprio.
> 3. **Apenas LAN** — usar `localhost`/`192.168.x.x` só funciona se você
>    rodar o cliente em `http://` (e não no GitHub Pages).

---

## 1. Pré-requisitos

- **Node.js 18+** — https://nodejs.org
- **PowerShell** (já vem no Windows)

```powershell
node --version   # deve mostrar v18.x ou superior
```

---

## 2. Subir o servidor local

```powershell
cd E:\PokeGame\server
copy .env.example .env       # depois edite .env
npm install
.\start.ps1
```

Saída esperada:

```
2026-06-02T... pkq-server up on ws://localhost:8080
2026-06-02T... origins  : https://Brun0Simoes.github.io, http://localhost:8000
2026-06-02T... auth     : token requerido
2026-06-02T... limits   : 8/IP, 30 msg/s, 65536B/msg
```

Health-check rápido: abra http://localhost:8080/health no navegador.

### Variáveis do `.env`

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `8080` | Porta TCP local. |
| `ALLOWED_ORIGINS` | (vazio = qualquer) | Lista de `Origin` HTTP permitidos. **Deixar vazio é inseguro.** |
| `AUTH_TOKEN` | (vazio) | Se setado, cliente deve conectar com `?token=...`. **Recomendado.** |
| `MAX_CONNECTIONS_PER_IP` | `8` | Anti-flood por IP. |
| `MAX_MESSAGE_BYTES` | `65536` | Tamanho máximo de mensagem. |
| `RATE_LIMIT_PER_SEC` | `30` | Token-bucket por conexão. |
| `HEARTBEAT_MS` | `30000` | Intervalo de ping; conexões mortas são derrubadas. |
| `TLS_CERT_PATH` / `TLS_KEY_PATH` | (vazio) | Para WSS direto sem túnel. |

Gere um token forte:

```powershell
# PowerShell:
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

---

## 3. Expor para o GitHub Pages via Cloudflare Tunnel (recomendado)

Cloudflare Tunnel é **gratuito**, dá uma URL HTTPS pública persistente
(`https://algo.trycloudflare.com` ou seu próprio domínio), sem precisar
abrir porta no roteador.

### 3.1 Instalar `cloudflared`

```powershell
winget install --id Cloudflare.cloudflared
```

(Ou baixe o `.exe` em https://github.com/cloudflare/cloudflared/releases.)

### 3.2 Túnel rápido (URL aleatória, sem cadastro)

Em um **segundo terminal** (deixe o servidor rodando no primeiro):

```powershell
cloudflared tunnel --url http://localhost:8080
```

Saída:

```
Your quick Tunnel has been created! Visit it at:
https://random-words-1234.trycloudflare.com
```

**Use esse host com `wss://`** no cliente:

```
wss://random-words-1234.trycloudflare.com/pkq?token=SEU_TOKEN
```

> A URL muda toda vez que você reinicia. Para URL fixa, use a opção 3.3.

### 3.3 Túnel nomeado (URL fixa, recomendado para uso recorrente)

Requer conta gratuita Cloudflare e um domínio. Resumo:

```powershell
cloudflared tunnel login
cloudflared tunnel create pkq
# associa um subdominio do seu dominio ao tunel:
cloudflared tunnel route dns pkq pkq.seu-dominio.com
```

Crie `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: pkq
credentials-file: C:\Users\bruno\.cloudflared\<UUID>.json

ingress:
  - hostname: pkq.seu-dominio.com
    service: http://localhost:8080
  - service: http_status:404
```

Rodar:

```powershell
cloudflared tunnel run pkq
```

O cliente passa a usar `wss://pkq.seu-dominio.com/pkq?token=...` — fixo.

### Alternativa: ngrok

```powershell
winget install ngrok.ngrok
ngrok http 8080
```

Pegue a URL `https://...ngrok-free.app` e use `wss://...ngrok-free.app`.
Free tier tem URL mutável e limite de sessão; ok para teste.

---

## 4. Conectar o cliente

Edite `E:\PokeGame\js\net.js`:

```js
export const NET_CONFIG = {
  mode: 'socket',
  url:  'wss://SEU-TUNEL.trycloudflare.com/?token=SEU_TOKEN',
  heartbeatMs: 4000,
  onlineWindowMs: 12000,
};
```

Commit + push para o GitHub. Após o deploy do Pages, abra o jogo e vá em
**Liga Online** — a aba agora fala com o seu servidor.

> **Dica:** não commite o `AUTH_TOKEN` no repositório público se ele der
> acesso a qualquer recurso seu. Para esse jogo o token só protege
> *conexões* (nada sensível no servidor), então é aceitável. Para algo
> sério, use OAuth/JWT real.

---

## 5. Checklist de segurança

- [x] **Origin allowlist** — apenas o domínio do GitHub Pages conecta
- [x] **Token compartilhado** — bloqueia conexões anônimas
- [x] **Rate limit** — 30 msg/s por conexão
- [x] **Tamanho de mensagem** — 64 KB máx
- [x] **Conexões por IP** — máx 8 simultâneas
- [x] **Heartbeat** — derruba conexões mortas em ~30s
- [x] **Validação de schema** — mensagens malformadas são descartadas
- [x] **Sem compressão** — evita ataques de compress-bomb
- [x] **TLS** — pelo túnel (Cloudflare) ou direto (`TLS_*_PATH`)
- [x] **Shutdown gracioso** — fecha conexões em SIGINT/SIGTERM
- [ ] *(futuro)* JWT real em vez de token compartilhado
- [ ] *(futuro)* validação de níveis/espécies em `team` (anti-cheat)

---

## 6. Solução de problemas

| Sintoma | Causa provável | Correção |
|---|---|---|
| Cliente conecta e cai imediatamente | Origin não bate | Confirme `ALLOWED_ORIGINS` (incluindo `https://`) |
| `401 Unauthorized` no log | Token errado ou ausente | Confira `?token=` na URL do cliente |
| Tudo conecta mas ninguém vê ninguém | Apenas um cliente conectado | Abra em outro dispositivo/aba |
| `429 Too Many Requests` | Mais de 8 conexões da mesma origem | Aumente `MAX_CONNECTIONS_PER_IP` |
| Funciona local, falha no GH Pages | URL `ws://` (não `wss://`) | Pages é HTTPS — exige `wss://` via túnel |

Logs do servidor mostram cada rejeição com motivo. Acompanhe com:

```powershell
.\start.ps1 | Tee-Object -FilePath server.log
```
