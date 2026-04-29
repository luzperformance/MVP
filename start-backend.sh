#!/bin/bash

# Cores para o output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
YELLOW='\033[1;33m'

echo -e "\n${YELLOW}============================================${NC}"
echo -e " ${YELLOW}Prontuario LuzPerformance - Backend Setup${NC}"
echo -e "${YELLOW}============================================${NC}"
echo ""

cd backend

echo "[1/4] Criando diretorios necessarios..."
mkdir -p data
mkdir -p uploads/photos
mkdir -p uploads/exams
mkdir -p logs
echo -e "      ${GREEN}OK${NC}"
echo ""

echo "[2/4] Verificando .env..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "      ${GREEN}.env criado a partir do .env.example${NC}"
    else
        echo -e "      ${RED}ERRO: .env.example nao encontrado!${NC}"
    fi
else
    echo -e "      ${GREEN}.env ja existe${NC}"
fi
echo ""

echo "[3/4] Instalando dependencias (pode demorar na primeira vez)..."
npm install
echo ""

echo "[4/4] Iniciando servidor..."
echo ""
echo -e "${YELLOW} ===================================================${NC}"
echo -e "  Servidor rodando em: ${GREEN}http://localhost:3222${NC}"
echo -e "  Health check:        ${GREEN}http://localhost:3222/api/health${NC}"
echo -e "${YELLOW} ===================================================${NC}"
echo ""
echo -e "  Primeiro acesso? Abra OUTRO terminal e rode:"
echo -e "  curl -X POST http://localhost:3222/api/auth/setup \\"
echo -e "    -H \"Content-Type: application/json\" \\"
echo -e "    -d '{\"name\":\"Dr Vinicius\",\"email\":\"dr@luzperformance.com.br\",\"password\":\"suaSenha123\",\"crm\":\"SC-33489\"}'"
echo ""
echo "  Pressione Ctrl+C para parar o servidor."
echo ""

npx tsx watch src/server.ts
