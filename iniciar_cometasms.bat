@echo off
chcp 65001 >nul
title CometaSMS - Inicialização
color 0A

echo ============================================
echo        CometaSMS - Inicializando...
echo ============================================
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! Instale em https://nodejs.org
    pause
    exit /b 1
)

:: Verificar ngrok
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] ngrok nao encontrado! Instale em https://ngrok.com
    echo Continuando sem ngrok...
    set SKIP_NGROK=1
)

:: Instalar dependências do backend
echo [1/4] Instalando dependencias do backend...
cd backend
if not exist node_modules (
    call npm install
) else (
    echo Dependencias do backend ja instaladas.
)

:: Verificar .env do backend
if not exist .env (
    echo [AVISO] Arquivo backend\.env nao encontrado!
    copy .env.example .env
    echo EDITE o arquivo backend\.env com suas chaves antes de usar!
    echo.
)

:: Iniciar backend
echo [2/4] Iniciando backend na porta 4000...
start "CometaSMS Backend" cmd /k "title CometaSMS Backend && node server.js"
cd ..

:: Aguardar backend iniciar
timeout /t 3 /nobreak >nul

:: Instalar dependências do frontend
echo [3/4] Instalando dependencias do frontend...
if not exist node_modules (
    call npm install
) else (
    echo Dependencias do frontend ja instaladas.
)

:: Iniciar frontend
echo [4/4] Iniciando frontend na porta 8080...
start "CometaSMS Frontend" cmd /k "title CometaSMS Frontend && npm run dev"

:: Iniciar ngrok (opcional)
if not defined SKIP_NGROK (
    echo Iniciando ngrok...
    start "CometaSMS Ngrok" cmd /k "title CometaSMS Ngrok && ngrok http 4000"
    echo.
    echo IMPORTANTE: Copie a URL do ngrok e coloque no .env como NGROK_URL
)

echo.
echo ============================================
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:8080
echo   Health:   http://localhost:4000/api/health
echo ============================================
echo.
echo Pressione qualquer tecla para ENCERRAR tudo...
pause >nul

:: Encerrar processos
taskkill /FI "WINDOWTITLE eq CometaSMS Backend" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq CometaSMS Frontend" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq CometaSMS Ngrok" /F >nul 2>nul
echo Processos encerrados.