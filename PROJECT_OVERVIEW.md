# MVP Luz Performance — Projeto Prontuário Eletrônico

Sistema telemedicina com prontuário eletrônico, análise IA de exames e gestão de pacientes.

## 📋 Visão Geral

| Aspecto | Detalhe |
|---------|---------|
| **Tipo** | Monorepo (Frontend + Backend + Shared) |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind |
| **Backend** | Node.js + Express + TypeScript |
| **Banco** | Supabase PostgreSQL + SQL.js (fallback) |
| **IA** | Google Gemini API + OpenRouter |
| **Auth** | JWT + bcrypt |

---

## 📁 Estrutura de Pastas

```
MVP/
├── frontend/              # React Vite app (porta 5173)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/        # Zustand
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/               # Express API (porta 3001)
│   ├── src/
│   │   ├── server.ts      # Entrada principal
│   │   ├── routes/        # Endpoints
│   │   ├── controllers/   # Lógica
│   │   ├── db/            # Database queries
│   │   ├── middleware/    # Auth, validation
│   │   └── services/      # Gemini, IA
│   ├── dist/              # Saída build
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                # Tipos compartilhados
├── .env.example           # Template de vars
├── package.json           # Root scripts
└── docker-compose.yml     # Services locais
```

---

## 🚀 Instalação Inicial

### 1️⃣ Dependências (uma vez)

```bash
# Na raiz (MVP/)
npm run install:all
```

Instala `node_modules` em `frontend/` e `backend/`.

### 2️⃣ Variáveis de Ambiente

**backend/.env**
```env
JWT_SECRET=chave_super_secreta_aqui
GEMINI_API_KEY=sua_chave_gemini
OPENROUTER_API_KEY=sua_chave_openrouter
DB_PATH=./data/prontuario.db
UPLOAD_PATH=./uploads
PORT=3001
NODE_ENV=development
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:3001
```

---

## 🛠️ Desenvolvimento

### Opção A: Backend + Frontend Simultaneamente

```bash
# Na raiz (MVP/)
npm run dev
```

- Backend roda em **localhost:3001** (com watch)
- Frontend roda em **localhost:5173** (com hot reload)
- Ambos em paralelo via `concurrently`

### Opção B: Separadamente

```bash
# Terminal 1 — Backend
cd backend
npm install      # Primeira vez
npm run dev      # Modo watch (tsx)
# Saída: Backend rodando na porta 3001
```

```bash
# Terminal 2 — Frontend
cd frontend
npm install      # Primeira vez
npm run dev      # Vite dev server
# Saída: Frontend rodando na porta 5173
```

---

## 🏗️ Build para Produção

### Build Completo (ambos)

```bash
# Na raiz (MVP/)
npm run build
```

Gera:
- `backend/dist/server.js` (transpilado com tsc)
- `frontend/dist/` (build Vite otimizado)

### Build Separado

```bash
# Só backend
npm run build:backend
# Transpila src/ → dist/ com tsc

# Só frontend
npm run build:frontend
# Bundla React com Vite
```

---

## ▶️ Iniciar em Produção

### Opção A: Node Puro

```bash
# Na raiz (MVP/)
NODE_ENV=production node backend/dist/server.js
```

- Backend começa na porta 3001
- Frontend deve ser servido via nginx ou S3

### Opção B: Docker

```bash
# Build da imagem
docker build -t luz-prontuario:latest -f backend/Dockerfile .

# Rodar container
docker run -p 3001:3001 \
  -e JWT_SECRET=... \
  -e GEMINI_API_KEY=... \
  luz-prontuario:latest
```

---

## 📊 Scripts Disponíveis

### Raiz (MVP/)

| Comando | O que faz |
|---------|-----------|
| `npm run install:all` | npm install em frontend/ e backend/ |
| `npm run dev` | Backend + Frontend em paralelo |
| `npm run build` | Build frontend + backend |
| `npm run build:frontend` | Só Vite build |
| `npm run build:backend` | Só tsc transpile |
| `npm run dev:frontend` | Só Vite dev |
| `npm run dev:backend` | Só tsx watch |
| `npm start` | Inicia backend em prod (NODE_ENV=production) |

### Backend (backend/)

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | tsx watch src/server.ts |
| `npm run build` | tsc (TypeScript → JavaScript) |
| `npm run start` | node dist/server.js |
| `npm run migrate` | Rodar migrations do banco |
| `npm run test` | vitest run (testes) |

### Frontend (frontend/)

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | vite (hot reload, localhost:5173) |
| `npm run build` | tsc + vite build |
| `npm run preview` | Preview do build |
| `npm run lint` | eslint . --ext .ts,.tsx |
| `npm run test` | vitest run (testes) |

---

## 🔄 Fluxo Típico

### Desenvolvimento

```bash
# Terminal na raiz
npm run dev

# Abre no navegador
# http://localhost:5173 (frontend)
# Backend na porta 3001

# Edita código → Hot reload automático
```

### Deploy

```bash
# 1. Build
npm run build

# 2. Testa localmente (opcional)
NODE_ENV=production npm start

# 3. Faz git push + CI/CD deploya
git add .
git commit -m "feat: xyz"
git push
```

---

## 🗄️ Banco de Dados

### SQLite (desenvolvimento local)

```bash
# Backend cria automaticamente data/prontuario.db
npm run dev
```

### PostgreSQL (Supabase em produção)

```bash
npm run migrate
# Executa migrations baseadas no schema
```

---

## ✅ Checklist Setup Inicial

- [ ] Node.js v20+ instalado (`node --version`)
- [ ] Clonar repo e entrar na pasta
- [ ] `npm run install:all` (instala deps)
- [ ] Copiar `.env.example` → `.env` em ambas pastas
- [ ] Preencher `GEMINI_API_KEY` em backend/.env
- [ ] `npm run dev` e verificar:
  - Backend: `http://localhost:3001/health` (retorna 200)
  - Frontend: `http://localhost:5173` (carrega app)

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| `EADDRINUSE: address already in use :3001` | Outra app na porta 3001. Kill com `lsof -i :3001 \| grep node \| awk '{print $2}' \| xargs kill` |
| `Cannot find module 'tsx'` | Não rodou `npm install`. Tenta `npm run install:all` |
| Frontend branco/erro 404 | Backend desligado. Verifica se `npm run dev:backend` está rodando |
| Erro "GEMINI_API_KEY undefined" | Copia backend/.env.example → backend/.env e preenche |
| `tsc: command not found` | NodeJS/npm não no PATH. Usa `npx tsc` |

---

## 📱 Stack Resumido

```
Frontend (localhost:5173)
    ↓ (axios)
Backend (localhost:3001)
    ├── Express routes
    ├── JWT middleware
    ├── Multer (uploads)
    ├── Gemini API calls
    └── SQLite/PostgreSQL
```

---

## 🔗 Referências

- Frontend: `frontend/src/` (React + Vite)
- Backend: `backend/src/server.ts` (Express entry)
- Tipos: `shared/` (TS interfaces)
- Env template: `.env.example`
