# Design: Seguimento (substitui Gestão + Ativos) + Leads com Kanban e tabela de campanhas (manual)

**Data:** 2026-03-20  
**Produto:** LuzPerformance Prontuário / CRM  
**Stack front:** React + Vite (deploy típico na Vercel como SPA estática; API Express separada)

---

## 1. Contexto e decisões fechadas

| Decisão | Escolha |
|--------|---------|
| Substituir **Gestão** e **Ativos** | Uma área **Seguimento** — mesma função da gestão atual (secretária, pacientes + admin/contrato). |
| Assets no Seguimento | **Não** — sem colunas nem expansão de catálogo de assets na tabela de pacientes (opção **A**). |
| Tabela de campanhas | **Manual** — nome, plataforma, orçamento, datas, status; sem API Google/Meta Ads na primeira versão (opção **B**). |
| Kanban | Mantém-se **separado** na área **Leads**; campanhas aparecem em **painel/tabela** no contexto Kanban (ver §4). |
| Performance / engenharia | Aplicar **Vercel React Best Practices** onde couber no cliente (§6). |
| Rota Seguimento | **Canónica:** `/crm/seguimento`. **`/gestao` → redirect** para a nova rota (decisão fechada). |
| Ativos no detalhe do lead | **Manter** secção **Ativos vinculados** em `LeadDetailPage` + `/api/assets` (decisão fechada). |

---

## 2. Information architecture (navegação)

| Área | Rota proposta | Utilizador-alvo | Entidade principal | Rótulo no menu |
|------|---------------|-----------------|--------------------|----------------|
| Seguimento | **`/crm/seguimento`** (canónica); **`/gestao` → redirect** | Secretária | `PatientManagement` | **Seguimento** |
| Leads (lista) | `/crm/leads` | Secretária / comercial | `Lead` | **Leads** |
| Leads (Kanban) | mesma rota, modo **Kanban** | Idem | `Lead` por status | Toggle **Lista \| Kanban** |
| ~~Gestão~~ | redirect → Seguimento | — | — | removido |
| ~~Ativos (catálogo)~~ | **Manter** rota e página **`/crm/assets`** (deep link / bookmark); **só remover do sidebar** — sem redirect nem 404 | Secretária / comercial | `Asset` | *(fora do menu)* |
| Ativos (lead) | só dentro de **`/crm/leads/:id`** — "Ativos vinculados" | Comercial / secretária | `Asset` + `lead_id` | *(sem item de menu)* |

**KPI "Ativos"** na tela de Seguimento (contagem de pacientes com gestão ativa) deve ser renomeado para **Pacientes ativos** para não colidir com o antigo menu "Ativos".

---

## 3. Seguimento (substitui Gestão + Ativos)

### 3.1 Comportamento

- Reutilizar **API existente** `/api/gestao`, `/api/gestao/summary`, import/export CSV, edição inline e modal completo — **sem** novos endpoints obrigatórios para assets de paciente.
- **UI:** renomear títulos, breadcrumbs e item de menu; remover link **Ativos** do `AppLayout`.
- **Assets:** manter **rotas `/api/assets`**, página **`/crm/assets`** (catálogo) e a secção **Ativos vinculados** em **LeadDetail**. Remover apenas o **item do sidebar** "Ativos". Fora do escopo: assets na tabela Seguimento.

### 3.2 Critérios de aceitação

- [ ] Menu CRM mostra **Seguimento** e **Leads** apenas (dois itens, além do que já existir).
- [ ] **`/gestao` redireciona para `/crm/seguimento`** (rota canónica nova).
- [ ] **LeadDetail** continua a mostrar **Ativos vinculados** com CRUD/listagem via API existente.
- [ ] Aceder **`/crm/assets` diretamente** continua a abrir o catálogo (mesmo sem link no menu).
- [ ] Nenhum item de menu aponta para o catálogo global; **`/crm/assets` continua acessível por URL**.
- [ ] Card/resumo que hoje diz "Ativos" passa a **Pacientes ativos** (ou equivalente claro).

---

## 4. Leads: Kanban separado + tabela de campanhas (manual)

### 4.1 Modelo de dados (SQLite)

Nova tabela sugerida `ad_campaigns` (nomes podem ser ajustados no plano):

- `id` (TEXT UUID)
- `name` (TEXT, obrigatório)
- `platform` (TEXT: ex. `meta`, `google`, `outro`)
- `budget_monthly` (REAL, opcional)
- `start_date`, `end_date` (TEXT ISO date, opcional)
- `status` (TEXT: `rascunho`, `ativa`, `pausada`, `encerrada`)
- `notes` (TEXT, opcional)
- `created_at`, `updated_at` (TEXT)
- `deleted_at` (TEXT, nullable) — soft delete alinhado ao resto do CRM

**Sem** integração OAuth / APIs de anúncios na v1.

### 4.2 UI — colocação

**Opção recomendada (A):** No modo **Kanban** da página Leads, layout em duas zonas:

1. **Topo (full width):** tabela compacta ou cards de campanhas — CRUD mínimo (adicionar / editar / arquivar).
2. **Abaixo:** `KanbanBoard` existente, inalterado em conceito (colunas por `LeadStatus`).

**Alternativa (B):** Sub-aba "Campanhas" vs "Funil" na mesma URL — mais cliques; só se o topo ficar poluído.

### 4.3 Ligação Lead ↔ Campanha (opcional v1.1)

- v1 pode ser **só tabela de campanhas** para visão operacional.
- v1.1: campo opcional `lead.campaign_id` ou tabela N:N — **fora do escopo** deste design se não for exigido agora.

### 4.4 Critérios de aceitação

- [ ] Modo Lista em Leads permanece como hoje.
- [ ] Modo Kanban mostra **acima** do board a lista/tabela de campanhas com CRUD manual.
- [ ] API REST autenticada: `GET/POST/PATCH/DELETE` (ou equivalente) para campanhas.
- [ ] Migração SQLite versionada em `backend/src/db/migrations/`.

---

## 5. Abordagens consideradas (resumo)

| # | Abordagem | Prós | Contras |
|---|-----------|------|---------|
| 1 | Seguimento = rename + redirect; campanhas só no Kanban | Pouco risco, rápido | Kanban fica mais denso |
| 2 | Seguimento nova rota; campanhas em página `/crm/campanhas` | Kanban limpo | Mais um item de menu |
| 3 | Monorepo Next.js (App Router) para tudo | SSR/RSC nativos na Vercel | **Rejeitado** — reescrita grande; MVP é Vite |

**Recomendação:** **Abordagem 1** para ship rápido; reavaliar (2) se a densidade do Kanban incomodar.

---

## 6. Diretrizes Vercel React Best Practices (front)

Aplicáveis ao **cliente React (Vite)**; ao fazer build de produção na **Vercel**:

1. **Eliminating waterfalls (`async-parallel`):** ao carregar Leads no Kanban, disparar em paralelo `fetch(leads)` e `fetch(campaigns)` com `Promise.all` (ou hooks separados sem sequenciar await desnecessário).
2. **Bundle (`bundle-dynamic-import`):** carregar o componente **KanbanBoard** (e eventualmente a tabela de campanhas pesada) via `React.lazy` + `Suspense` para não inflar o bundle da vista Lista.
3. **Re-renders (`rerender-memo`):** linhas da tabela Seguimento e linhas da tabela de campanhas como `React.memo` + chaves estáveis.
4. **Listas longas (`rendering-content-visibility`):** considerar `content-visibility: auto` na tabela Seguimento (CSS) ou virtualização numa fase 2 se performance reclamar.
5. **Transições (`rerender-use-transition` / `useTransition`):** alternar Lista/Kanban com `startTransition` para manter UI responsiva.

**Nota:** Regras específicas de **Next.js** (RSC, `next/dynamic`) **não** se aplicam até haver migração; manter como referência futura.

---

## 7. Fora de escopo (v1)

- Sincronização automática com Google Ads / Meta Ads.
- Gestão de assets na tabela Seguimento.
- Novo Kanban separado só para campanhas (usuário pediu tabela, não board de campanhas).

**Dentro do escopo v1:** catálogo **Ativos** (`/crm/assets`) **mantém-se** implementado; só some do **sidebar**. Lead detail e API inalterados em capacidade.

---

## 8. Testes sugeridos

- Redirecionamento e nav: secretária e médico (permissões atuais).
- CRUD campanhas + listagem com soft delete.
- Leads: alternância Lista/Kanban sem regressão de fetch.
- LeadDetail: **Ativos vinculados** continua a funcionar (listar / associar) após remover o item de menu global.

---

## 9. Próximo passo

Após aprovação deste documento: skill **writing-plans** → plano em `docs/superpowers/plans/2026-03-20-seguimento-leads-campanhas.md`.

---

**Aprovação:** _decisões fechadas — (1) `/crm/seguimento` + redirect de `/gestao`; (2) Ativos vinculados no lead; (3) **`/crm/assets` mantida** (só fora do menu). Pronto para **writing-plans**._
