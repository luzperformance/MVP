# Alinhamento ao MVP Luz Performance

**Repositório:** [https://github.com/luzperformance/MVP](https://github.com/luzperformance/MVP) (público; verificado por clone em 2026-03-28).

## Stack (fonte: README + código)

| Camada | Tecnologia |
|--------|------------|
| **View** | React 18, Vite, TypeScript, Tailwind CSS (`frontend/`) |
| **Controller / API** | Express + TypeScript, rotas em `backend/src/routes/*.ts` |
| **Model / persistência** | SQLite por defeito (`sql.js` + ficheiro em `DB_PATH`); **PostgreSQL** opcional (`USE_PG=true`, `DATABASE_URL`) |
| **IA** | Gemini API (`GEMINI_API_KEY`) — transcrição / notas SOAP |
| **Auth** | JWT + bcrypt (`/api/auth`) |

**Nota:** O README menciona `better-sqlite3`; o runtime em `database.ts` usa **sql.js** com API compatível e gravação periódica do `.db`. Migrações legadas podem referir `better-sqlite3`.

## Mapeamento MVC → pastas do repo

| MVC | Onde está no MVP |
|-----|-------------------|
| **Model** | `backend/src/db/`, queries nos routers e serviços (`backend/src/services/`) |
| **View** | `frontend/src` (componentes React) |
| **Controller** | Routers Express montados em `backend/src/server.ts` |

## Prefixos de API (`server.ts`)

| Prefixo | Área |
|---------|------|
| `/api/auth` | Autenticação |
| `/api/patients` | Pacientes, prontuário (records), exames, fotos, layouts BI |
| `/api/ai` | Transcrição / IA |
| `/api/finance` | Finanças |
| `/api/calendar` | Calendário |
| `/api/consultas` | Consultas |
| `/api/leads` | Leads |
| `/api/assets` | Assets |
| `/api/gestao` | Gestão |
| `/api/alerts` | Alertas |
| `/api/public` | Endpoints públicos (ex.: leads) |

## Módulos descritos no README

1. **Auth** — login único (JWT + bcrypt)
2. **Pacientes** — CRUD, anamnese, consentimento LGPD
3. **Prontuário** — notas **SOAP** (transcrição IA ou manual)
4. **Exames** — upload PDF, valores, dashboard
5. **Fotos de evolução** — upload e galeria por paciente
6. **LGPD** — exportação, exclusão, audit log (`middleware/lgpd.ts`)

## Entidades (indício em migração SQLite → PG)

- `doctor` — utilizador clínico (email, password_hash, name, crm, specialty…)
- `patients` — dados demográficos + campos de gestão (em PG parte vive em `mgmt_data` JSONB)
- `records` — `soap_subjective`, `soap_objective`, `soap_assessment`, `soap_plan`, `consultation_date`, `type`, `source`, metadata (ex.: `raw_input`, notas)

## Variáveis de ambiente (README)

**Backend:** `JWT_SECRET`, `GEMINI_API_KEY`, `DB_PATH`, `UPLOAD_PATH`, `PORT` (default 3001).  
**Frontend:** `VITE_API_URL=http://localhost:3001`  
**Produção:** CORS inclui `https://prontuario.luzperformance.com.br` e domínios luzperformance.

## Dev local

- Backend: `cd backend && npm install && npm run dev` → porta **3001**
- Frontend: `cd frontend && npm install && npm run dev` → porta **5173**

## Documentação extra no repo

- `.agents/` — skills e agentes (Squire)
- `prontuario_mvp_plan.md` — plano de build (se existir na raiz)
- `squire.md` — regras do agente

Quando evoluires o domínio **hormonal/performance**, manter consistência com **SOAP** e tabelas existentes; novos campos de protocolo hormonal devem ligar-se a `patients` / `records` ou novas migrações explícitas.
