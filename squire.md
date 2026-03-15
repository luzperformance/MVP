# Squire -- Agent Operating System

> Drop this file into your project root or `~/.claude/` to give your AI agent a behavioral operating system.
> Derived from 2,990 sessions, 3,307 commits, and 12 shipped products across 5 months.
> Customize the sections below for your workflow. Delete what you don't need.

---

## Project Context — Prontuário LuzPerformance

**Stack:** React 18 + Vite + TypeScript (frontend) | Node.js + Express + TypeScript (backend) | SQLite3 (better-sqlite3)

**Key Files:**
- Backend entry: `backend/src/server.ts`
- DB connection: `backend/src/db/database.ts`
- Migrations: `backend/src/db/migrations/001_init.sql`
- Frontend entry: `frontend/src/App.tsx`
- Design tokens: `frontend/src/index.css`
- Types: `shared/types.ts`

**Active Skills:** `.agents/skills/` (medical-scribe, healthcare-compliance, kpi-dashboard, etc.)

**LGPD:** Todas as modificações em dados de pacientes devem manter o audit_log e o soft delete.

---

## Behavioral Rules

### 1. Default to Implementation

When asked to implement something, start coding immediately. Do not spend the entire session exploring and planning unless explicitly asked to create a plan.

When continuing a prior session's work, execute the existing plan immediately. Do NOT re-present the plan for approval or ask "should I proceed?" The plan was already approved.

### 2. Plan Means Plan

When the user asks for "a plan", deliver a written plan document. Not an audit. Not a visualization. Not a deep exploration. A concise implementation plan with files, order, and rationale.

### 3. Preflight Before Push

Always run a preflight check (build, tests, lint, type-check) BEFORE pushing to any remote. Never push without explicit user approval. The sequence is: fix -> verify -> ask -> push. Never: fix -> push -> hope.

### 4. Investigate Bugs Directly

When the user reports a bug or runtime error, investigate and fix it directly. Do not dismiss issues as "stale cache", "hot reload artifact", or "transient" without concrete evidence. If it broke, something changed. Find what changed.

### 5. Scope Changes to the Target

Scope configuration changes to the specific project requested. Do not apply rules, env changes, hooks, or config globally across all repos unless the user explicitly says "all repos" or "globally." One project = one project.

### 6. Verify After Each Edit

After editing each file, run `npx tsc --noEmit` (or equivalent type-check) before moving to the next file. Do not batch 6 file edits and then discover cascading type errors. Catch them one at a time.

### 7. Visual Output Verification

When the user says something is visually wrong (colors, sizing, layout), check the rendered output or exact CSS/component values -- do not just re-read the source code and assume it's correct.

### 8. Check Your Environment

Before running database CLI commands, deployment commands, or environment-specific operations, verify you're targeting the correct project/environment. Never assume the current context is correct.

### 9. Don't Over-Engineer

Only make changes that are directly requested or clearly necessary. Don't add features, refactor code, or make "improvements" beyond what was asked. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.

---

## Execution Patterns

Seven patterns govern how the agent works. Apply always: Metacognitive + PEV + Inversion. Apply when appropriate: Reflection, Tree of Thoughts, Ensemble.

| Pattern | When | Signal |
|---------|------|--------|
| **Inversion** | Problem-solving, debugging, architecture | "What would guarantee failure?" -- eliminate wrong answers first |
| **Reflection** | Writing 50+ lines of code | Generate, critique, refine before presenting |
| **PEV** | Before commits/deploys | Plan, Execute, Verify outcomes |
| **Metacognitive** | Always, especially high-stakes | Express confidence: High/Medium/Low/Don't Know. Never hallucinate. |
| **Tree of Thoughts** | Complex decisions | Generate 2-3 approaches with pros/cons, recommend one |
| **Ensemble** | Important architectural choices | Consider builder/quality/user/maintenance perspectives |

---

## Git Workflow

### Branch Protection

Never commit directly to `main`. Use feature branches and PRs.

### Commit Convention

```
[Stage N: Stage Name] type: description
```

Types: `feat`, `fix`, `deps`, `docs`, `verify`, `refactor`, `test`

---

## LGPD Rules (Brasil)

1. **Nunca** remover a coluna `deleted_at` — é o soft delete obrigatório por LGPD
2. **Sempre** registrar no `audit_log` qualquer acesso a dados de pacientes
3. **Nunca** armazenar CPF em texto plano — usar campo `cpf_encrypted`
4. **Sempre** incluir o endpoint de exportação LGPD ao criar novas entidades de paciente
5. Retenção default: 5 anos após `deleted_at`
