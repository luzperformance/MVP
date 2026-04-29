# ESCOPO DO PROJETO — MVP Prontuário LuzPerformance

> **Documento autoritativo de escopo.**
> Toda feature, tela, componente ou API deve ser validada contra este documento.
> Se não está aqui como PERMITIDO, está FORA DE ESCOPO.
>
> Última atualização: 29/04/2026

---

## 1. O QUE É ESTE PROJETO

Sistema de prontuário eletrônico e gestão de consultório médico para clínica de **endocrinologia / hormônio / metabolismo**. O médico acompanha o paciente desde a captação (lead CRM) até a evolução clínica, passando por agenda, anamnese, exames, financeiro e gestão de pacotes.

**Público:** 95% mobile. Todo componente é mobile-first.

---

## 2. DENTRO DO ESCOPO

### 2.1 Prontuário Clínico

- Anamnese **clínica hormonal metabólica** (template estruturado):
  - Queixa principal
  - História hormonal (TH, anticoncepcional, ginecológica/urologia)
  - Metabologia (glicemia, insulina, lipidograma, ácido úrico, HOMA-IR)
  - Composição corporal (peso, % gordura, circunferência abdominal)
  - Sinais e sintomas (fadiga, libido, humor, sono, calor)
  - Exame físico
  - Plano terapêutico (planejamento de acompanhamento — NÃO é prescrição)
- Registro SOAP (Subjetivo, Objetivo, Avaliação, Plano)
- CID-10 lookup no diagnóstico
- Timeline visual do prontuário
- Comparação entre consultas (evolução)
- Prontuário IMUTÁVEL após salvo (audit trail)

### 2.2 Exames e Biomarcadores

- Cadastro e visualização de exames laboratoriais
- Tabela resumo: marcador | valor | referência | status (normal/alto/baixo)
- Destaque automático de valores críticos
- Timeline de marcadores com gráficos (Recharts)
- Comparação lado-a-lado entre exames
- Flag de exame vencido
- Gráfico radar para perfil hormonal/metabólico

### 2.3 Relatórios (apenas os listados abaixo)

| Tipo | O que inclui |
|---|---|
| Relatório financeiro | Receitas, despesas, inadimplência, comparativo mensal, tendência |
| Relatório de atendimento | Volume de consultas, pacientes ativos, evolução por período |
| Relatório de marketing/CRM | Funil de conversão, origem de leads, taxa de conversão, custo por lead |
| Relatório de exames (do paciente) | Biomarcadores, valores, referência, evolução temporal |

**Todos os relatórios são para gestão e acompanhamento — NENHUM é documento médico.**

### 2.4 Financeiro

- KPIs: receita, despesa, resultado
- Gráficos: barras (mensal), pizza (categorias), tendência (linha)
- Import CSV, filtro por mês/ano
- Marcação pagamento: recebido/pendente
- Dashboard de inadimplência
- Categorias customizáveis de despesa
- Comparativo mês-a-mês

### 2.5 CRM / Leads

- Kanban por status (novo → contato → qualificado → proposta → convertido → perdido)
- Temperatura do lead (frio/morno/quente)
- Fonte do lead (indicação, Instagram, Google, site, evento, outro)
- Painel de campanhas publicitárias
- Funil de conversão visual
- Lead scoring, follow-up reminders
- Histórico de interações por lead
- WhatsApp click-to-chat

### 2.6 Gestão de Pacientes

- Cadastro completo (dados pessoais, contato, plano)
- Status ativo/inativo
- Pacotes: mensal, trimestral, semestral, anual
- Alerta de pacote vencendo
- Renovação de pacote
- Import/export de dados
- Histórico de pagamentos por paciente

### 2.7 Agenda

- Visualização mensal, semanal, diária
- Integração Google Calendar (OAuth)
- Criação/edição de eventos
- Status do agendamento: confirmado, pendente, cancelado, compareceu/não compareceu
- Alerta de conflito de horário
- Lista de pacientes do dia

### 2.8 Dashboard

- KPIs com dados reais: pacientes ativos, consultas hoje/semana, receita mês, leads quentes
- Mini sparklines de tendência
- Próximas consultas
- Alertas de marcadores críticos
- Funil CRM resumido

### 2.9 Segurança e LGPD

- Autenticação JWT real
- Rate limiting
- Security headers (Helmet)
- Audit log de ações
- Exportação de dados do paciente (LGPD)
- Anonimização de dados (LGPD)
- Validação Zod em todas as APIs

### 2.10 UI/UX — Componentes Obrigatórios

- `<Badge>`, `<Button>`, `<Input>`, `<Modal>`, `<Tabs>`, `<Tooltip>`, `<Avatar>`
- `<Toast>` — feedback visual temporário
- `<ConfirmDialog>` — confirmação de ações destrutivas
- `<Skeleton>` — loading states
- `<DataTable>` — sort/filter/pagination
- `<BottomTabBar>` — navegação mobile (5 itens fixos)
- `<FAB>` — ação principal por página
- `<Sheet>` — bottom drawer mobile
- Zero `style={{}}` inline — usar classes ou props de componentes

---

## 3. FORA DO ESCOPO — PROIBIDO

| # | O que é | Motivo |
|---|---|---|
| 1 | Emissão de receitas médicas | Não é escopo médico deste sistema |
| 2 | Atestados médicos | Não é escopo médico deste sistema |
| 3 | Laudos médicos | Não é escopo médico deste sistema |
| 4 | Prescrições médicas formais | Não é escopo médico deste sistema |
| 5 | Qualquer documento médico para assinatura/impressão | Não é escopo médico deste sistema |
| 6 | Nutrição / dieta / macronutrientes / refeições | Não é escopo deste sistema |
| 7 | Exercícios / treino / periodização esportiva | Não é escopo deste sistema |
| 8 | WADA / anti-doping | Não é escopo deste sistema |
| 9 | Anamnese esportiva | Apenas anamnese hormonal metabólica |
| 10 | Teleconsulta / vídeo | Desejável futuro, não no MVP |
| 11 | PWA / Offline | Desejável futuro, não no MVP |
| 12 | Agendamento pelo paciente (self-service) | Desejável futuro, não no MVP |

> **Regra simples:** Se não está na seção 2, não se faz. Em dúvida, perguntar.

---

## 4. STACK TÉCNICO

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Express + TypeScript + tsx |
| DB Dev | SQLite (sql.js) |
| DB Prod | PostgreSQL 16 |
| ORM | Direto (pg / sql.js) — migração futura para Drizzle |
| Charts | Recharts |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validação | Zod |
| Deploy | Docker Compose / Vercel + Neon |

---

## 5. PÁGINAS DO SISTEMA

| Rota | Página | Status |
|---|---|---|
| `/login` | Login | OK |
| `/dashboard` | Dashboard | Melhorar KPIs |
| `/patients` | Lista de pacientes | Melhorar filtros/paginação |
| `/patients/new` | Novo paciente | OK |
| `/patients/:id` | Detalhe do paciente + prontuário | Melhorar tabs/timeline |
| `/patients/:id/record/new` | Nova consulta (SOAP + anamnese) | Adicionar template hormonal |
| `/patients/:id/exams` | Biomarcadores / timeline | Melhorar tabela resumo |
| `/consultas` | Semana (embed GCal) | Migrar para view nativa |
| `/agenda` | Mês | OK |
| `/finance` | Financeiro | Melhorar trends/relatório |
| `/crm/leads` | CRM Leads + Kanban | Melhorar funil/scoring |
| `/crm/leads/:id` | Detalhe do lead | OK |
| `/crm/seguimento` | Gestão de pacientes | Melhorar card view |
| `/assets` | Assets | OK |
| `/setup` | Setup inicial | OK |

---

## 6. PLANO DE EXECUÇÃO

```
FASE 1 → Fundação UI      (componentes base: Toast, ConfirmDialog, Badge, Button, Input, Modal, Skeleton, Avatar, Tabs, DataTable)
FASE 2 → Mobile-First     (BottomTabBar, FAB, Sheet, touch targets, pull-to-refresh)
FASE 3 → Dashboard        (KPIs reais, sparklines, próximas consultas, alertas)
FASE 4 → Pacientes+Prontuário (filtros, paginação, anamnese hormonal metabólica, CID-10, timeline)
FASE 5 → Exames           (tabela resumo, valores críticos, comparação, radar)
FASE 6 → Financeiro+CRM   (trends, relatórios PDF permitidos, funil, scoring)
FASE 7 → Agenda           (view semanal/diária nativa, status agendamento)
FASE 8 → Polish           (perf, a11y, error boundaries, skeletons, SWR)
```

**Tempo estimado:** 8-10 dias

---

## 7. HISTÓRICO DE MUDANÇAS

| Data | Mudança |
|---|---|
| 29/04/2026 | Criação do documento. Removido: nutrição, exercício, anamnese esportiva, emissão de documentos médicos, WADA. Escopo de anamnese limitado a clínica hormonal metabólica. Relatórios limitados a financeiro/atendimento/marketing/CRM. |
