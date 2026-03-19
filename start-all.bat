@echo off
echo 🚀 Iniciando o Prontuario LuzPerformance com Docker e Persistencia...

:: Verifica se o Docker esta rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erro: O Docker nao esta rodando. Por favor, abra o Docker Desktop.
    pause
    exit /b
)

:: Sobe os containers em modo destacada (background)
:: Isso ja inclui o Postgres com persistencia, o Backend e o Frontend
echo 📦 Subindo containers (Banco de Dados, API e Frontend)...
docker-compose up -d --build

echo.
echo ✅ Tudo pronto!
echo 🌐 Frontend: http://localhost:5173
echo 🔌 API Backend: http://localhost:3001
echo 🐘 Postgres: localhost:5432
echo.
echo Para ver os logs, use: docker-compose logs -f
echo Para parar tudo, use: docker-compose down
pause
