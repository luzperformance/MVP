@echo off
setlocal
echo 🐘 Iniciando Ecossistema Prontuario LuzPerformance (Docker + Postgres)

:: 1. Verificacao do Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERRO: O Docker Desktop nao esta rodando!
    echo.
    echo Por favor, abra o Docker Desktop antes de continuar.
    echo.
    pause
    exit /b
)

:: 2. Limpeza de Logs e Subida
echo 🚀 Subindo Containers e Camada de Persistencia...
docker-compose up -d --build

:: 3. Status Check
echo.
echo ⏳ Aguardando inicializacao dos servicos...
timeout /t 5 /nobreak >nul

echo.
echo ✅ AMBIENTE PRONTO!
echo ----------------------------------------
echo 🌐 Frontend:    http://localhost:5173
echo 🔌 API Backend: http://localhost:3001
echo 🐘 Database:    PostgreSQL (Porta 5432)
echo 💾 Persistencia: data/postgres e backend/uploads
echo ----------------------------------------
echo.
echo [Dica] Use 'docker-compose logs -f' para ver os logs em tempo real.
echo [Dica] Use 'docker-compose down' para desligar tudo com seguranca.
echo.
pause
