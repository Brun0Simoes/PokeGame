# ============================================================
# Pocket Quest — container unico: serve a pagina + backend
# (WebSocket Liga Online + API de save) no mesmo origin.
# ============================================================
FROM node:20-alpine

# Curl para o healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# 1) Dependencias do servidor (camada cacheada)
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund

# 2) Codigo do servidor
COPY server/server.js ./server/server.js

# 3) Arquivos estaticos do jogo -> /app/public
COPY index.html manifest.webmanifest sw.js icon.svg ./public/
COPY css ./public/css
COPY js  ./public/js

# Diretorio de saves (montar volume aqui para persistir)
RUN mkdir -p /app/saves

ENV NODE_ENV=production \
    PORT=8090 \
    STATIC_DIR=/app/public \
    SAVE_DIR=/app/saves

EXPOSE 8090

# Healthcheck contra o endpoint /health
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8090/health || exit 1

CMD ["node", "server/server.js"]
