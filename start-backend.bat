@echo off
chcp 65001 >nul
title Prontuario LuzPerformance - Backend
echo.
echo ============================================
echo  Prontuario LuzPerformance - Backend Setup
echo ============================================
echo.

cd /d D:\MVP\backend

echo [1/4] Criando diretorios necessarios...
if not exist "data" mkdir data
if not exist "uploads\photos" mkdir uploads\photos
if not exist "uploads\exams" mkdir uploads\exams
if not exist "logs" mkdir logs
echo      OK
echo.

echo [2/4] Verificando .env...
if not exist ".env" (
  copy .env.example .env
  echo      .env criado a partir do .env.example
) else (
  echo      .env ja existe
)
echo.

echo [3/4] Instalando dependencias (pode demorar na primeira vez)...
call npm install
echo.

echo [4/4] Iniciando servidor...
echo.
echo  ===================================================
echo  Servidor rodando em: http://localhost:3222
echo  Health check:        http://localhost:3222/api/health
echo  ===================================================
echo.
echo  Primeiro acesso? Abra OUTRO terminal e rode:
echo  curl -X POST http://localhost:3222/api/auth/setup ^
echo    -H "Content-Type: application/json" ^
echo    -d "{\"name\":\"Dr Vinicius\",\"email\":\"dr@luzperformance.com.br\",\"password\":\"suaSenha123\",\"crm\":\"SC-33489\"}"
echo.
echo  Pressione Ctrl+C para parar o servidor.
echo.

call npx tsx watch src/server.ts

pause
