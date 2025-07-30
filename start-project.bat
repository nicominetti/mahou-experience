@echo off
echo ========================================
echo   INICIANDO PROYECTO MINTAKA
echo ========================================
echo.

REM Definir el puerto a usar
set PORT=4321

REM Matar todos los procesos de Node.js y npm
echo Matando procesos existentes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
taskkill /f /im bun.exe >nul 2>&1

REM Matar proceso específico en el puerto si existe
echo Liberando puerto %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":%PORT%" ^| find "LISTENING"') do (
    echo Matando proceso en puerto %PORT% (PID: %%a)
    taskkill /f /pid %%a >nul 2>&1
)

REM Esperar un momento
timeout /t 2 >nul

REM Navegar al directorio del proyecto
cd /d "E:\Zurdo\mintaka"

echo.
echo Iniciando servidor en puerto %PORT%...
echo.

REM Iniciar el proyecto usando npm/bun
if exist "bun.lock" (
    echo Usando Bun...
    bun run dev --port %PORT%
) else (
    echo Usando NPM...
    npm run dev -- --port %PORT%
)

pause
