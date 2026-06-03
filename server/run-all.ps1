# run-all.ps1 — sobe pkq-server + ngrok em background (hidden).
# Logs em server.log e ngrok.log nesta pasta.
# Rodar de novo: derruba instancias antigas antes.

$ErrorActionPreference = 'SilentlyContinue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# 1. Para instancias anteriores (idempotente)
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'server\.js' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Get-Process ngrok | Stop-Process -Force
Start-Sleep -Milliseconds 500

# 2. Garante deps instaladas
if (-not (Test-Path "$root\node_modules")) {
    Start-Process npm -ArgumentList 'install','--no-audit','--no-fund' -Wait -WindowStyle Hidden -WorkingDirectory $root
}

# 3. Sobe pkq-server (hidden, log redirecionado)
Start-Process cmd `
    -ArgumentList '/c','node server.js > server.log 2>&1' `
    -WindowStyle Hidden `
    -WorkingDirectory $root

# 4. Sobe ngrok com dominio estatico (hidden)
Start-Process cmd `
    -ArgumentList '/c','ngrok http --url=https://wilhelmina-calvus-overmellowly.ngrok-free.dev 8080 --log=ngrok.log --log-level=info > nul 2>&1' `
    -WindowStyle Hidden `
    -WorkingDirectory $root

# 5. Verifica saude apos uns segundos
Start-Sleep -Seconds 4
$ok = $false
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8080/health' -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $ok = $true }
} catch {}

if ($ok) {
    Write-Host "pkq-server e ngrok rodando em background." -ForegroundColor Green
    Write-Host "Health  : http://localhost:8080/health" -ForegroundColor Gray
    Write-Host "Publico : https://wilhelmina-calvus-overmellowly.ngrok-free.dev" -ForegroundColor Gray
    Write-Host "Logs    : $root\server.log e $root\ngrok.log" -ForegroundColor Gray
} else {
    Write-Host "Algo falhou ao subir. Veja server.log / ngrok.log nesta pasta." -ForegroundColor Red
}
