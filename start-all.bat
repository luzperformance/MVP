@echo off
echo Iniciando o Prontuario MVP - LuzPerformance

:: Inicia o Backend em uma nova janela
echo Iniciando Backend...
start "Backend API" cmd /k "cd backend && npm run dev"

:: Aguarda uns segundos para o backend inicializar o banco
timeout /t 3 /nobreak >nul

:: Inicia o Frontend em outra janela
echo Iniciando Frontend...
start "Frontend React/Vite" cmd /k "cd frontend && npm run dev"

echo Tudo rolando! Olhe as novas janelas do terminal.
