#!/bin/bash

# Cores para o output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
YELLOW='\033[1;33m'

echo -e "🐘 ${YELLOW}Iniciando Ecossistema Prontuario LuzPerformance (Docker + Postgres)${NC}"

# 1. Verificacao do Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "\n${RED}❌ ERRO: O Docker nao esta rodando!${NC}"
    echo "Por favor, inicie o servico do Docker antes de continuar."
    exit 1
fi

# 2. Limpeza de Logs e Subida
echo -e "🚀 ${GREEN}Subindo Containers e Camada de Persistencia...${NC}"
docker compose up -d --build

# 3. Status Check
echo -e "\n⏳ Aguardando inicializacao dos servicos..."
sleep 5

echo -e "\n${GREEN}✅ AMBIENTE PRONTO!${NC}"
echo "----------------------------------------"
echo -e "🌐 Frontend:    ${GREEN}http://localhost:5173${NC}"
echo -e "🔌 API Backend: ${GREEN}http://localhost:3001${NC}"
echo "🐘 Database:    PostgreSQL (Porta 5432)"
echo "💾 Persistencia: data/postgres e backend/uploads"
echo "----------------------------------------"
echo ""
echo "[Dica] Use 'docker compose logs -f' para ver os logs em tempo real."
echo "[Dica] Use 'docker compose down' para desligar tudo com seguranca."
echo ""
