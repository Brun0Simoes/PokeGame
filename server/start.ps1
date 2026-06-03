# start.ps1 — sobe o servidor WebSocket local (Windows).
# Uso:   .\start.ps1
# Pre-req: Node 18+ e `npm install` ja rodado neste diretorio.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Write-Host "Aviso: .env nao encontrado. Copiando de .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Edite o .env antes de expor o servidor a internet." -ForegroundColor Yellow
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Cyan
    npm install
}

Write-Host "Iniciando pkq-server..." -ForegroundColor Green
node server.js
