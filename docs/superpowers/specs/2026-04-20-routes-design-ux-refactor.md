# MVP Routes & Design System Refactor — Design Doc

**Data:** 2026-04-20  
**Escopo:** Refatoração completa de rotas backend/frontend + Design System + UX/Navegação  
**Estratégia:** 4 Agentes especializados em paralelo  

---

## 1. Diagnóstico Atual

### Backend Routes (Express)

- **16 rotas instaladas** em `backend/src/routes/`
- **Problema:** Inconsistência de padrões
  - `/api/patients/:patientId/pre-consult-summary` (aninhado)
  - `/api/patients` (raiz)
  - `/api/ai/transcription` (genérico)
- **Sem REST semantics claros** em alguns endpoints
- **Falta versionamento** (há `/api/v2` mas rotas antigas em `/api`)

### Frontend Routes (React Router)

- **15 páginas** em `frontend/src/pages/`
- **Problema:** Falta padrão de hierarquia
  - `/patients/:id` ✅
  - `/patients/:id/records/new` ✅
  r- `/consultas` ❌ (deveria ser `/appointments` ou `/agendamentos`?)
  - `/finance` vs `/patients/exams` (inconsistência visual)
- **Sem breadcrumbs/navegação secundária** clara

### Design System

- **UI Components:** `frontend/src/components/ui/` (Radix UI)
- **Problema:** Sem design tokens centralizados
- **Layout:** Componentes espalhados (`layout/`, `sections/`, `components/`)
- **Sem padrões de concordância** em nomes (AgendaPage vs ConsultasPage vs CalendarPage?)

### UX/Navegação

- **Sem mapa de fluxo do usuário** documentado
- **Ambiguidades:**
  - "Consultas" vs "Agenda" — são a mesma coisa?
  - "Exames" está em `/patients/:id/exams` mas também em FinanceDashboard
  - "Records" (New) vs "Consultas" — qual usar?

---

## 2. Solução Proposta

### 2.1 Padrão de Rotas Backend (RESTful Standardizado)

#### Estrutura de Versões

```
/api/v1/  ← DEPRECATED (legacy, não adicionar features novas)
/api/v2/  ← NOVO PADRÃO (architecture limpa)
```

#### Padrão de Rotas v2

**Pacientes**

```
GET    /api/v2/patients                    # Listar
POST   /api/v2/patients                    # Criar
GET    /api/v2/patients/:id                # Detalhe
PATCH  /api/v2/patients/:id                # Atualizar
DELETE /api/v2/patients/:id                # Soft-delete

# Sub-recursos (sempre nested)
GET    /api/v2/patients/:id/records        # Registros de consulta
POST   /api/v2/patients/:id/records        # Novo registro
GET    /api/v2/patients/:id/exams          # Exames de laboratório
POST   /api/v2/patients/:id/exams          # Novo exame
GET    /api/v2/patients/:id/pre-consult-summary  # IA summaries
```

**Consultas/Agenda**

```
GET    /api/v2/appointments                # Listar
POST   /api/v2/appointments                # Criar
GET    /api/v2/appointments/:id            # Detalhe
PATCH  /api/v2/appointments/:id            # Atualizar
GET    /api/v2/appointments/:id/calendar   # Sincronizado com Google Calendar
```

**Leads**

```
GET    /api/v2/leads                       # Listar
POST   /api/v2/leads                       # Criar (CRM)
GET    /api/v2/leads/:id                   # Detalhe
PATCH  /api/v2/leads/:id                   # Atualizar
```

**Financeiro**

```
GET    /api/v2/finances                    # Dashboard
GET    /api/v2/finances/summary            # Resumo
POST   /api/v2/finances/transactions       # Registrar transação
```

**Assets/Gestão**

```
GET    /api/v2/assets                      # Recursos
POST   /api/v2/assets                      # Upload
GET    /api/v2/assets/:id/download         # Download
```

---

### 2.2 Padrão de Rotas Frontend (React Router)

#### Hierarquia Clara

```
/                          # Root
├─ /login                  # Público
├─ /setup                  # Setup inicial
└─ /* (AuthGuard)
   ├─ /dashboard           # Home
   ├─ /patients
   │  ├─ /                 # Lista
   │  ├─ /new              # Criar novo
   │  ├─ /:id              # Detalhe
   │  ├─ /:id/records
   │  │  ├─ /              # Lista de consultas
   │  │  └─ /new           # Nova consulta
   │  └─ /:id/exams        # Exames do paciente
   ├─ /appointments        # Agenda/Consultas
   │  ├─ /                 # Lista
   │  ├─ /new              # Agendar
   │  └─ /:id              # Detalhe
   ├─ /finance             # Financeiro
   │  ├─ /                 # Dashboard
   │  └─ /transactions     # Transações
   ├─ /leads               # Gestão de Leads
   │  ├─ /                 # Lista
   │  ├─ /new              # Novo lead
   │  └─ /:id              # Detalhe
   ├─ /assets              # Recursos
   ├─ /gestao              # Gestão geral
   └─ /admin               # (Futuro) Admin panel
```

#### Padrões de Nomenclatura

- **URLs:** snake-case (`/appointments`, `/exams`)
- **Páginas:** PascalCase + Page suffix (`AppointmentsPage.tsx`)
- **Componentes:** PascalCase (`PatientCard.tsx`)
- **Hooks:** camelCase com `use` prefix (`usePatientDetail()`)

---

### 2.3 Design System Unificado

#### Design Tokens Centralizados

**Arquivo:** `frontend/src/config/designTokens.ts`

```typescript
export const designTokens = {
  colors: {
    primary: '#F4A460',      // luz-gold (Luz brand)
    secondary: '#1F2937',    // dark
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  typography: {
    heading1: { size: 32, weight: 700 },
    heading2: { size: 24, weight: 600 },
    body: { size: 14, weight: 400 },
    small: { size: 12, weight: 400 },
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
  }
}
```

#### Componentes Padrão

- Buttons: primary, secondary, danger, ghost
- Cards: patient-card, appointment-card, lead-card
- Forms: input, select, checkbox, radio, textarea
- Tables: patients-table, records-table, leads-table
- Modals: confirmation, form, info
- Alerts: success, error, warning, info

---

### 2.4 UX & Navegação

#### Fluxos de Usuário Principais

**Fluxo 1: Atender Paciente**

```
Dashboard → Patients → Patient Detail → New Record → Pre-consult Summary → Edit Record
```

**Fluxo 2: Agendar Consulta**

```
Dashboard → Appointments → New Appointment → Google Calendar Sync
```

**Fluxo 3: Analisar Exames**

```
Dashboard → Patient Detail → Exams Tab → Exam Detail → BI Dashboard
```

**Fluxo 4: Gestionar Leads**

```
Dashboard → Leads → Lead Detail → Convert to Patient
```

#### Navegação Global

- **NavBar:** Dashboard, Patients, Appointments, Finance, Leads, Assets, Gestao
- **Breadcrumbs:** Em todas sub-páginas
- **Mobile:** Menu hamburger com mesma estrutura

---

## 3. Estratégia de Execução (4 Agentes)

### Agente 1: Backend Architect (Routes + API Design)

**Responsável por:**

- Refatorar backend routes em `/api/v2`
- Padronizar REST semantics
- Controllers + Models pattern
- Documentar endpoints (OpenAPI specs)
- Status codes consistentes

**Saída esperada:**

- ✅ Novo router `/api/v2` funcional
- ✅ Tipos TypeScript para payloads
- ✅ Documentação de endpoints

---

### Agente 2: Frontend Expert (Routes + Navigation)

**Responsável por:**

- Refatorar React Router hierarchy
- Implementar breadcrumbs
- Links consistentes entre páginas
- Mobile navigation
- Validar nomenclatura de rotas

**Saída esperada:**

- ✅ Nova estrutura de rotas em App.tsx
- ✅ Breadcrumb component
- ✅ Navegação mobile funcional

---

### Agente 3: UI/Design Specialist (Design System + Components)

**Responsável por:**

- Criar design tokens centralizados
- Padronizar componentes (buttons, cards, forms, tables)
- Concordância visual entre páginas
- Temas (light/dark mode ready)
- Documentação de componentes

**Saída esperada:**

- ✅ `designTokens.ts` completo
- ✅ Componentes refatorados
- ✅ Storybook ou style guide (opcional)

---

### Agente 4: QA/Security Validator (Testing + Compliance)

**Responsável por:**

- Validar consistência backend ↔ frontend
- Testar fluxos de usuário (E2E scenarios)
- LGPD compliance check
- Security review (auth, encryption, rate-limiting)
- Performance audit (routes, lazy loading)

**Saída esperada:**

- ✅ Teste de fluxos críticos
- ✅ Relatório de compliance
- ✅ Performance metrics

---

## 4. Critérios de Sucesso

### Backend

- [ ] Todos endpoints em `/api/v2` com padrão REST
- [ ] Controllers com single responsibility
- [ ] 100% tipos TypeScript (sem `any`)
- [ ] Documentação OpenAPI auto-gerada

### Frontend

- [ ] Rotas hierárquicas claras
- [ ] Breadcrumbs em todas sub-páginas
- [ ] Sem broken links (validar navegação)
- [ ] Mobile responsive

### Design System

- [ ] Design tokens centralizados
- [ ] Todos componentes usam tokens
- [ ] Concordância visual verificada
- [ ] Nomes padronizados (snake-case URLs, PascalCase pages)

### UX/Navegação

- [ ] Fluxos de usuário documentados
- [ ] NavBar com todos módulos acessíveis
- [ ] 3-click rule: usuário chega a qualquer feature em ≤3 cliques
- [ ] Mobile-first design

### QA/Security

- [ ] Testes E2E para fluxos críticos
- [ ] Nenhum erro 404 em links internos
- [ ] LGPD audit log funcionando
- [ ] Rate limiting ativo

---

## 5. Dependências & Ordem de Execução

```
Agentes 1, 2, 3, 4 rodam em PARALELO

Mas:
- Agente 1 (Backend) deve terminar antes de Agente 2 adaptar URLs
- Agente 3 (Design) pode rodar independente
- Agente 4 (QA) valida outputs de 1, 2, 3

Síntese final: Consolidar outputs em PR única
```

---

## 6. Entregáveis Finais

1. **Backend:**
   - `backend/src/presentation/routes/` com estrutura v2 completa
   - Controllers + Models pattern
   - OpenAPI spec gerado

2. **Frontend:**
   - `frontend/src/App.tsx` refatorado com nova hierarchy
   - Breadcrumb component + navbar refatorado
   - Todas rotas apontam para `/api/v2`

3. **Design System:**
   - `frontend/src/config/designTokens.ts`
   - Componentes padronizados em `frontend/src/components/`

4. **QA & Docs:**
   - Testes E2E para fluxos críticos
   - Relatório de compliance LGPD
   - Documentação de arquitetura

5. **Git:**
   - 1 commit por agente (ou squashed em 1 PR)
   - Mensagem clara descrevendo refactoring

---

## 7. Riscos & Mitigações

| Risco | Mitigação |
|-------|-----------|
| Agentes entram em conflito | Specs claras por domínio; revisão final de conflitos |
| v1 routes quebram | Manter v1 por 2 sprints; redirect automático |
| Frontend quebra links | Agente 4 valida 404s; teste E2E |
| Design inconsistente | Agente 3 cria guide; code review antes merge |

---

## 8. Timeline

- **T0:** Specs aprovadas (AGORA)
- **T1:** Agentes rodam em paralelo (2-4 horas)
- **T2:** QA valida outputs (1 hora)
- **T3:** Merge & deploy (1 hora)
- **Total:** ~4-6 horas de clock-time
