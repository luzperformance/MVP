# Skills Squire Instaladas — MVP Prontuário LuzPerformance

## Localização das Skills

As skills originais estão em: `D:\Luxprontuário\squire\skills\`

Os arquivos SKILL.md de cada skill relevante foram copiados para:
`D:\MVP\.agents\skills\{skill-name}\SKILL.md`

## Skills Ativas neste Projeto

### Domínio Médico
| Skill | Uso no MVP |
|-------|-----------|
| `medical-scribe` | System prompt do serviço Gemini para gerar SOAP notes |
| `healthcare-compliance` | Base para implementar LGPD adaptada ao Brasil |

### Backend & Banco
| Skill | Uso no MVP |
|-------|-----------|
| `senior-backend` | Arquitetura Node.js + Express + TypeScript |
| `database-design` | Schema SQLite3 + índices + triggers |
| `api-design` | Design dos endpoints REST |
| `file-uploads` | Multer config para fotos e PDFs |
| `security-scanner` | Audit de JWT, sanitização, LGPD |
| `supabase-postgres-best-practices` | Referência para patterns de RLS e queries |

### Frontend & UI
| Skill | Uso no MVP |
|-------|-----------|
| `ui-builder` | Componentes React do prontuário |
| `vercel-react-best-practices` | memo(), lazy(), Suspense |
| `state-management` | Zustand store pattern |
| `data-analyzer` | Processar valores numéricos dos exames |
| `kpi-dashboard` | Dashboard Recharts com linha do tempo |

### Qualidade & Compliance
| Skill | Uso no MVP |
|-------|-----------|
| `testing-qa` | Testes Vitest dos endpoints |
| `compliance-checker` | Checklist LGPD pré-deploy |
| `senior-fullstack` | Decisões de arquitetura geral |

## Como Usar

Para ativar uma skill ao dar um prompt, mencione:
```
Usando a skill medical-scribe, melhore o system prompt do serviço Gemini.
Usando a skill database-design, adicione uma tabela de medicamentos.
Usando a skill kpi-dashboard, adicione um gráfico de radar ao ExamDashboard.
```

## Comandos Disponíveis

| Comando | Arquivo | Uso |
|---------|---------|-----|
| `/blueprint` | `.agents/commands/blueprint.md` | Planejar nova feature |
| `/feature-dev` | `.agents/commands/feature-dev.md` | Implementar feature |
| `/integration-audit` | `.agents/commands/integration-audit.md` | Auditar após mudanças |
| `/test-verify` | `.agents/commands/test-verify.md` | Rodar testes |
| `/fix` | `.agents/commands/fix.md` | Debug sistemático |
| `/ship` | `.agents/commands/ship.md` | Deploy final |

## Agentes Disponíveis

| Agente | Arquivo | Quando usar |
|--------|---------|-------------|
| `backend-architect` | `.agents/agents/backend-architect.md` | Novas APIs e schemas |
| `database-migration-specialist` | `.agents/agents/database-migration-specialist.md` | Novas migrations SQLite3 |
| `watcher-security-validator` | `.agents/agents/watcher-security-validator.md` | Audit de segurança |
| `watcher-database-integrity` | `.agents/agents/watcher-database-integrity.md` | Validar constraints |
| `watcher-code-quality-guardian` | `.agents/agents/watcher-code-quality-guardian.md` | Review TypeScript |
