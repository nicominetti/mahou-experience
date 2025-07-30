# Script para iniciar el proyecto Mintaka en puerto específico
# Uso: .\start-project.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO PROYECTO MINTAKA" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Definir el puerto a usar
$PORT = 4321

# Función para matar procesos
function Kill-ProcessesByName {
    param($ProcessName)
    
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "Matando procesos de $ProcessName..." -ForegroundColor Yellow
        $processes | Stop-Process -Force
    }
}

# Matar todos los procesos de Node.js, npm y bun
Write-Host "Matando procesos existentes..." -ForegroundColor Yellow
Kill-ProcessesByName "node"
Kill-ProcessesByName "npm" 
Kill-ProcessesByName "bun"

# Matar proceso específico en el puerto si existe
Write-Host "Liberando puerto $PORT..." -ForegroundColor Yellow
$netstat = netstat -aon | Select-String ":$PORT.*LISTENING"
if ($netstat) {
    $netstat | ForEach-Object {
        $pid = ($_.ToString() -split '\s+')[-1]
        Write-Host "Matando proceso en puerto $PORT (PID: $pid)" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# Esperar un momento
Start-Sleep -Seconds 2

# Navegar al directorio del proyecto
Set-Location "E:\Zurdo\mintaka"

Write-Host ""
Write-Host "Iniciando servidor en puerto $PORT..." -ForegroundColor Green
Write-Host ""

# Iniciar el proyecto usando npm/bun
if (Test-Path "bun.lock") {
    Write-Host "Usando Bun..." -ForegroundColor Blue
    & bun run dev --port $PORT
} else {
    Write-Host "Usando NPM..." -ForegroundColor Blue
    & npm run dev -- --port $PORT
}

Read-Host "Presiona Enter para cerrar..."
