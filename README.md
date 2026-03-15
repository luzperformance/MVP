# Prontuário MVP — LuzPerformance Telemedicina

Sistema de prontuário eletrônico para médico único de telemedicina.

## Stack
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Banco:** SQLite3 (better-sqlite3)
- **IA:** Gemini API

## Estrutura
```
D:/MVP/
├── frontend/        # React app
├── backend/         # Node.js API
├── shared/          # Types compartilhados
├── .agents/         # Skills, agentes e comandos Squire
│   ├── skills/      # 16 skills relevantes
│   ├── agents/      # 7 agentes especializados
│   ├── commands/    # 9 slash commands
│   └── prompts/     # 6 thinking frameworks
├── pipeline/        # Stage-gate build system
├── templates/       # VISION, SPEC, BUILDING templates
├── doc-templates/   # Feature spec, ADR, deployment checklist
└── squire.md        # Regras comportamentais do agente
```

## Módulos do Sistema
1. **Auth** — Login único (JWT + bcrypt)
2. **Pacientes** — CRUD + anamnese + consentimento LGPD
3. **Prontuário** — SOAP notes via transcrição (IA) ou manual
4. **Exames Laboratoriais** — Upload PDF + valores + dashboard
5. **Fotos de Evolução** — Upload + galeria por paciente
6. **LGPD** — Exportação, exclusão e audit log

## Inicialização

### Backend
```bash
cd backend
npm install
npm run dev   # porta 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # porta 5173
```

## Variáveis de Ambiente

### backend/.env
```
JWT_SECRET=sua_chave_secreta_aqui
GEMINI_API_KEY=sua_chave_gemini_aqui
DB_PATH=./data/prontuario.db
UPLOAD_PATH=./uploads
PORT=3001
```

### frontend/.env
```
VITE_API_URL=http://localhost:3001
```

## Plano de Build
Ver: `.agents/` para skills e agentes
Ver: `prontuario_mvp_plan.md` para o plano completo

## LGPD
Este sistema implementa conformidade com a LGPD (Lei 13.709/2018):
- Consentimento registrado no cadastro do paciente
- Direito de acesso: exportação JSON de todos os dados
- Direito de exclusão: soft delete com prazo de retenção
- Audit log: todo acesso a dados pessoais é registrado
- Mínimo de dados: CPF opcional, armazenado criptografado
