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
echo [1/3] Instalando dependencias do backend...
cd backend
if not exist node_modules (
    call npm install
) else (
    echo Dependencias ja instaladas.
)

:: Verificar .env
if not exist .env (
    echo [AVISO] Arquivo .env nao encontrado!
    echo Copiando .env.example para .env...
    copy .env.example .env
    echo EDITE o arquivo backend\.env com suas chaves antes de usar!
    echo.
)

:: Iniciar backend
echo [2/3] Iniciando backend na porta 4000...
start "CometaSMS Backend" cmd /k "title CometaSMS Backend && node server.js"

:: Aguardar backend iniciar
timeout /t 3 /nobreak >nul

:: Iniciar ngrok
if not defined SKIP_NGROK (
    echo [3/3] Iniciando ngrok...
    start "CometaSMS Ngrok" cmd /k "title CometaSMS Ngrok && ngrok http 4000"
    echo.
    echo IMPORTANTE: Copie a URL do ngrok e coloque no .env como NGROK_URL
) else (
    echo [3/3] Pulando ngrok...
)

echo.
echo ============================================
echo   Backend: http://localhost:4000
echo   Health:  http://localhost:4000/api/health
echo ============================================
echo.
echo Pressione qualquer tecla para ENCERRAR tudo...
pause >nul

:: Encerrar processos
taskkill /FI "WINDOWTITLE eq CometaSMS Backend" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq CometaSMS Ngrok" /F >nul 2>nul
echo Processos encerrados.
