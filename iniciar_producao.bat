@echo off
chcp 65001 >nul
title CometaSMS - Producao (PM2 + Serve)
color 0A

echo ============================================
echo    CometaSMS - Iniciando em PRODUCAO
echo ============================================
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! Instale em https://nodejs.org
    pause
    exit /b 1
)

:: Verificar/Instalar PM2 global
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] PM2 nao encontrado. Instalando globalmente...
    call npm install -g pm2
)

:: Verificar/Instalar serve global
where serve >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] serve nao encontrado. Instalando globalmente...
    call npm install -g serve
)

:: ===== BACKEND =====
echo.
echo [1/4] Preparando BACKEND...
cd backend
if not exist node_modules (
    echo Instalando dependencias do backend...
    call npm install
)
if not exist .env (
    echo [AVISO] backend\.env nao encontrado! Copiando do .env.example
    copy .env.example .env
    echo EDITE backend\.env com suas chaves antes de continuar!
    pause
)
cd ..

:: ===== FRONTEND =====
echo.
echo [2/4] Preparando FRONTEND...
if not exist node_modules (
    echo Instalando dependencias do frontend...
    call npm install
)

echo.
echo [3/4] Gerando build de producao do frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha no build do frontend!
    pause
    exit /b 1
)

:: ===== PM2 =====
echo.
echo [4/4] Iniciando processos no PM2...

:: Backend (porta 4000 ou definida no .env)
pm2 describe cometasms-backend >nul 2>nul
if %errorlevel% equ 0 (
    echo Reiniciando cometasms-backend...
    pm2 restart cometasms-backend
) else (
    echo Iniciando cometasms-backend...
    pm2 start backend/server.js --name cometasms-backend
)

:: Frontend (serve estatico na porta 80)
pm2 describe cometasms-frontend >nul 2>nul
if %errorlevel% equ 0 (
    echo Reiniciando cometasms-frontend...
    pm2 restart cometasms-frontend
) else (
    echo Iniciando cometasms-frontend na porta 80...
    pm2 start "npx serve -s dist -l 80" --name cometasms-frontend
)

:: Salvar estado do PM2
pm2 save

echo.
echo ============================================
echo   Backend:  http://localhost:4000/api/health
echo   Frontend: http://localhost (porta 80)
echo ============================================
echo.
echo Comandos uteis:
echo   pm2 list          - ver processos
echo   pm2 logs          - ver logs em tempo real
echo   pm2 restart all   - reiniciar tudo
echo   pm2 stop all      - parar tudo
echo.
pm2 list
echo.
pause
