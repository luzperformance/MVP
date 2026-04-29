#!/bin/bash

# Cores para o output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
YELLOW='\033[1;33m'

echo -e "\n${YELLOW}🏥 PRONTUARIO LUZPERFORMANCE - INICIANDO (SQLITE)${NC}"
echo "------------------------------------------------------"
echo -e "${YELLOW}[Dica]${NC} Este modo nao precisa de Docker."
echo -e "${YELLOW}[Dica]${NC} Backend: ${GREEN}http://localhost:3001${NC}"
echo -e "${YELLOW}[Dica]${NC} Frontend: ${GREEN}http://localhost:5173${NC}"
echo "------------------------------------------------------"

# Verifica se node_modules existe na raiz
if [ ! -d "node_modules" ]; then
    echo -e "${RED}[ERROR] node_modules nao encontrados. Executando instalacao...${NC}"
    npm install
fi

# Inicia o servidor usando o script dev do package.json raiz
npm run dev
