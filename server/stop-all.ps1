# stop-all.ps1 — derruba pkq-server + ngrok em background.

$ErrorActionPreference = 'SilentlyContinue'

$nodeCount  = 0
$ngrokCount = 0

Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'server\.js' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force; $nodeCount++ }

Get-Process ngrok | ForEach-Object { $_ | Stop-Process -Force; $ngrokCount++ }

Write-Host "Parado: $nodeCount pkq-server, $ngrokCount ngrok." -ForegroundColor Yellow
