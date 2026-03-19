# Dynamic BI Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a highly interactive, customizable BI dashboard for patient medical records with drag-and-drop grid and glassmorphism styling.

**Architecture:** A full-stack feature. Backend uses SQLite (`patient_bi_layouts` table) to persist user configurations. Frontend uses `react-grid-layout` for the drag-and-drop grid and `recharts` for customizable biomedical data visualization.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui, Recharts, React-Grid-Layout, Express, SQLite.

---

### Task 1: Database Migration for Layouts

**Files:**
- Create: `backend/src/db/migrations/008_bi_dashboard.sql`
- Modify: `backend/package.json` (add run script for apply-008 if needed)
- Create: `backend/apply-008.ts`

- [ ] **Step 1: Write SQL Migration**
Write `008_bi_dashboard.sql` to create `patient_bi_layouts` table (`id`, `patient_id`, `doctor_id`, `layout_data` (JSON), `created_at`, `updated_at`).
- [ ] **Step 2: Write Apply Script**
Create `apply-008.ts` to execute the migration via `better-sqlite3`.
- [ ] **Step 3: Run Migration**
Run: `npx tsx apply-008.ts` (or whatever the project uses)
Expected: Table successfully created.
- [ ] **Step 4: Commit**
`git add backend/src/db/migrations/008_bi_dashboard.sql backend/apply-008.ts`
`git commit -m "feat: add patient_bi_layouts table"`

---

### Task 2: Backend API Endpoints

**Files:**
- Create: `backend/src/routes/biLayouts.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Write Route file**
Create `biLayouts.ts` with `GET /api/patients/:id/layout` and `POST /api/patients/:id/layout`. Ensure validation middleware and standard error handling.
- [ ] **Step 2: Register Router**
In `server.ts`, mount the router `app.use('/api/patients', biLayoutsRouter)` or similar.
- [ ] **Step 3: Test endpoints manually or via jest**
Ensure the endpoint accepts JSON layout strings and fetches them correctly.
- [ ] **Step 4: Commit**
`git add backend/src/routes/biLayouts.ts backend/src/server.ts`
`git commit -m "feat: bi layouts API endpoints"`

---

### Task 3: Install Frontend Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install `react-grid-layout` and `recharts`**
Run: `npm install react-grid-layout recharts` in `frontend/`
- [ ] **Step 2: Install Types**
Run: `npm install -D @types/react-grid-layout` in `frontend/`
- [ ] **Step 3: Commit**
`git add frontend/package.json frontend/package-lock.json`
`git commit -m "chore: add react-grid-layout and recharts"`

---

### Task 4: Base Dashboard Component & Grid

**Files:**
- Create: `frontend/src/components/bi/DashboardBIContainer.tsx`
- Create: `frontend/src/components/bi/EmptyStateGlass.tsx`
- Modify: `frontend/src/pages/ConsultasPage.tsx` (or target page to mount the dashboard)

- [ ] **Step 1: Build EmptyStateGlass component**
Implement the glassmorphism zero-state view with the `animate-float` class.
- [ ] **Step 2: Build DashboardBIContainer component**
Fetch layout and biomarker data. Render `<ResponsiveGridLayout>`. Use tailwind `bg-white/5 border border-white/10 backdrop-blur` classes on Grid Items.
- [ ] **Step 3: Mount in a Page**
Include `<DashboardBIContainer patientId={id} />` in the relevant patient view (e.g. nested route in patients page).
- [ ] **Step 4: Verify UI**
Expected: Empty state renders perfectly, basic grid functions work.
- [ ] **Step 5: Commit**
`git commit -am "feat: BI dashboard container and empty state"`

---

### Task 5: Widget Builder and Recharts Integration

**Files:**
- Create: `frontend/src/components/bi/WidgetBuilderModal.tsx`
- Create: `frontend/src/components/bi/ChartWidget.tsx`

- [ ] **Step 1: Build ChartWidget**
Wrap `<ResponsiveContainer>` and `<LineChart>` from `recharts`. Use `--luz-gold` (`#c9a44a`) for line strokes and gradients. Inject Orbitron for fonts.
- [ ] **Step 2: Build WidgetBuilderModal**
Create the `.btn-primary` trigger. Inside modal, list available biomarkers from exam data. On submit, call parent `onAddWidget` function to immediately update the layout JSON.
- [ ] **Step 3: Wire up auto-save**
Ensure `onLayoutChange` in the React-Grid-Layout pushes updates to the backend API (`POST /api/patients/:id/layout`).
- [ ] **Step 4: Final verification**
Run the frontend, interact with widgets, drag them, resize, save, reload page -> state persists.
- [ ] **Step 5: Commit**
`git commit -am "feat: BI dashboard builder and charts"`
