s# UI/UX PROMPTS — LuzPerformance

> Referência rápida de prompts otimizados para copy-paste.
> Cada prompt já carrega o **Design System real** do projeto extraído de `index.css`, `tailwind.config.js`, e dos componentes existentes.

---

## Design System — Tokens de Referência (NÃO ALTERAR)

```yaml
Platform: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
Routing: react-router-dom (file-based pages in src/pages/)
Icons: lucide-react
Fonts:
  display: "'Orbitron', sans-serif"         # classe .font-display
  body:    "'Montserrat', sans-serif"       # padrão do body

Colors (CSS vars + hex):
  --luz-navy:        "#0d1f33"              # bg principal
  --luz-navy-light:  "#1a3a5c"              # cards e superfícies
  --luz-navy-medium: "#142a42"              # superfícies intermediárias
  --luz-gold:        "#c9a44a"              # accent / CTA / headings
  --luz-gold-light:  "#d4b55a"              # hover do gold
  --luz-gold-dark:   "#b8933a"              # gold escuro
  --luz-white:       "#ffffff"              # títulos
  --luz-gray:        "#e0e0e0"              # corpo de texto
  --luz-gray-dark:   "#a0a0a0"              # texto secundário

Surface Pattern:
  glassmorphism: "bg-white/5 border border-white/10 backdrop-blur"
  grid-pattern:  "bg-image linear-gradient gold 0.02 opacity, 40px grid"
  article-card:  "bg-transparent border border-[#c9a44a]/30 rounded-xl p-6 hover:border-[#c9a44a] hover:shadow-[0_0_30px_#c9a44a26]"

Buttons (classes CSS pré-definidas):
  .btn-primary:   "bg-gold text-navy rounded-full px-8 py-4 uppercase tracking-wider shadow"
  .btn-secondary: "border-2 border-gold text-gold rounded-full hover:bg-gold hover:text-navy"
  .btn-outline:   "border border-gold/30 text-gold rounded-full text-xs hover:bg-gold/10"

Animations (classes pré-definidas):
  .animate-fade-in       .animate-fade-in-up      .animate-fade-in-down
  .animate-pulse-glow    .animate-float           .animate-slide-up-fade
  .animate-chat-open     .stagger-1 ... .stagger-6

Layout Patterns:
  - Header + Footer globais (src/sections/)
  - Pages em src/pages/ com layout: min-h-screen bg-[#0d1f33] → <Header/> → <main> → <Footer/>
  - Máx. largura conteúdo: max-w-7xl (listagem) | max-w-3xl (leitura)
  - Wave dividers SVG entre seções (WaveTop / WaveBottom)

Conventions:
  - Configuração centralizada em src/config/siteConfig.ts (DOCTOR, CONTACT)
  - Dados em src/data/ (articles.ts com interface Article + generateSlug)
  - Componentes de UI genéricos via shadcn em src/components/ui/
  - memo() + useCallback() + useMemo() nos componentes pesados
  - Lazy loading com React.lazy() + Suspense para componentes secundários
  - Google Identity Services para autenticação de comentários
```

---

## 1. Blog Post Page — Página Individual SEO-Optimized

**Cenário:** O blog já saiu do modal. Agora existe `BlogPostPage.tsx` com página dedicada em `/blog/:slug`. O prompt abaixo serve para **evoluir** essa página.

**Prompt:**

```markdown
Evolve the existing BlogPostPage at src/pages/BlogPostPage.tsx following the EXACT design system below.

**DESIGN SYSTEM (MANDATORY — extracted from the codebase):**
- Layout wrapper: `min-h-screen bg-[#0d1f33]` → `<Header />` → `<main>` → `<Footer />`
- Content column: `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8`
- Hero image: full-width `h-[300px] md:h-[400px]` with gradient overlay `bg-gradient-to-t from-[#0d1f33] via-[#0d1f33]/60 to-transparent`
- Title: `text-3xl md:text-4xl font-bold text-[#c9a44a] leading-tight`
- Category badge: `bg-[#c9a44a]/20 text-[#c9a44a] px-3 py-1 rounded-full text-xs font-medium`
- Body text: `text-gray-300 mb-3 leading-relaxed text-lg`
- Sub-headings in content: `text-xl font-bold text-[#c9a44a] mt-8 mb-3`
- Breadcrumb: `text-sm text-gray-400 hover:text-[#c9a44a]` com separador `/`
- CTA bottom: `btn-primary` com texto "Agendar Minha Teleconsultoria" usando `CONTACT.whatsappUrl` de siteConfig
- Back link: `.link-underline text-[#c9a44a] text-sm font-medium`
- Comments: lazy-loaded `PostComments` component via `React.lazy()`
- Content parser: `renderContent()` parseia `**bold**` → h3 gold, `• bullet` → li, `*italic*` → p italic

**Enhancements to add:**
1. Add `react-helmet-async` for `<title>`, `<meta description>`, and OpenGraph tags (og:title, og:description, og:image)
2. Add estimated reading time badge next to the date
3. Add Author Bio card at the bottom (Dr. Vinícius Luzardi, CRM-SC 33489 / CRM-SP 265830) — use a glassmorphic card: `bg-white/5 border border-white/10 rounded-xl`
4. Add structured data (JSON-LD) for Article schema

**DO NOT change:**
- PostComments component (already complete with Google Auth, likes, share dropdown)
- Article data structure in src/data/articles.ts
- siteConfig.ts constants
```

---

## 2. Lead Capture Gate — Analisador de Exames

**Cenário:** O usuário finaliza o upload mas a IA entrega o resultado de graça, sem capturar o e-mail.

**Prompt:**

```markdown
Implement a Lead Capture gating step in ExamAnalyzerPage.tsx. When AI processing finishes, show an Email Capture Card BEFORE revealing ExamResult.

**DESIGN SYSTEM (MANDATORY):**
- Page layout: `min-h-screen bg-[#0d1f33]` → `<Header />` → content → `<Footer />`
- Capture Card: glassmorphic — `bg-white/5 border border-white/10 rounded-xl p-8`
- Icon: locked shield or document, color `text-[#c9a44a]`, size `w-12 h-12`
- Title: `text-2xl font-bold text-white`
- Subtitle: `text-gray-400 text-sm leading-relaxed`
- Input fields: `bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-[#c9a44a]/50 focus:border-[#c9a44a]/50`
- Submit button: `btn-primary` full width — "Ver Meu Resultado Agora"
- Error text: `text-red-400 text-xs`
- Footer text: `text-gray-500 text-[11px]` — LGPD compliance note
- Animation: `animate-fade-in-up` on card mount

**User Flow:**
1. User uploads PDF → AI processes → `isLoading` becomes false
2. Instead of showing ExamResult, render EmailCaptureCard
3. On form submit: `console.log({ name, email })` → update state → render ExamResult
4. Only modify state transitions in ExamAnalyzerPage.tsx + create EmailCaptureCard component

**DO NOT** change the AI logic or ExamResult component.
```

---

## 3. Viral Loop — WhatsApp Share no ExamResult

**Cenário:** Incentivar compartilhamento após resultado da análise de exames.

**Prompt:**

```markdown
Add a "Share on WhatsApp" viral section to ExamResult.tsx, below the markers section and before the "Analisar outro exame" button.

**DESIGN SYSTEM (MANDATORY):**
- Card container: `bg-white/5 border border-white/10 rounded-xl p-6` with subtle glow: `shadow-[0_0_30px_rgba(201,164,74,0.1)]`
- Headline: `text-lg font-bold text-white` — "Desafie um Amigo"
- Subtext: `text-gray-400 text-sm leading-relaxed`
- WhatsApp button: `bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold rounded-full px-6 py-3 transition-all` with Share2 icon from lucide-react
- Button label: "Compartilhar no WhatsApp"
- Behavior: `window.open('https://wa.me/?text=...')` with encoded message: "Olha só, a IA do Dr. Vinícius analisou meu exame de sangue. Testa o seu risco aqui: [SITE_URL]"
- Animation: `animate-slide-up-fade stagger-3`

**Context:** This must feel secondary to the primary "Agende sua Consulta" CTA (which uses `btn-primary`), but still highly clickable and gamified.
```

---

## 4. Watermark — Get Motivated (Antes/Depois)

**Cenário:** O paciente baixa o "Antes e Depois" e posta no Instagram, mas sem o nome da LuzPerformance.

**Prompt:**

```markdown
Add an elegant watermark to the generated image in ComparisonView.tsx (Get Motivated tool).

**DESIGN SYSTEM (MANDATORY):**
- Position: Bottom-right corner of the html2canvas capture wrapper div
- Style: `absolute bottom-3 right-3 flex items-center gap-1.5 opacity-70`
- Text: "Analisado por IA · LuzPerformance.com"
- Font: `text-[11px] text-white font-medium` with drop shadow: `drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]`
- Optional: small sparkle/AI icon (Sparkles from lucide-react, `w-3 h-3`)

**Critical:** The watermark div MUST be INSIDE the wrapper that html2canvas captures, so it gets baked into the downloaded image. It should look premium, not like a stock photo watermark.
```

---

## 5. Blog Section (Home) — Referência de Estilo

**Cenário:** Documentação da seção Blog na home (`src/sections/Blog.tsx`) para manter consistência.

**Padrão atual implementado:**

```yaml
Component: Blog (src/sections/Blog.tsx)
Layout:
  - WaveTop / WaveBottom SVG dividers
  - BackgroundElements: bg-[#0d1f33] + .grid-pattern opacity-30
  - Content: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

Header:
  - Title: .font-display com gradient gold (from-[#f3d077] via-[#c9a44a] to-[#8a6d29])
  - Subtitle: text-gray-300 max-w-2xl mx-auto text-lg

Category Filters:
  - .btn-outline com .active state
  - Filtro inteligente: só mostra categorias com posts publicados
  - "Todos os Posts" só aparece quando ≥2 categorias têm posts

Article Cards:
  - .article-card class (border-gold/30, rounded-xl, hover effects)
  - Images: h-[184px] object-cover rounded-t-lg
  - Titles: text-[#c9a44a] hover:text-[#d4b55a]
  - "Leia Mais": .link-underline text-[#c9a44a]
  - Grid: md:grid-cols-2 lg:grid-cols-3 gap-6
  - Animation: animate-fade-in com animKey para re-render

CTA:
  - .btn-outline → "Ver Todos os Artigos" (Link to /blog)
  - .btn-primary → "AGENDE SUA CONSULTA" (CONTACT.whatsappUrl)

Routing: <Link to={/blog/${generateSlug(article.title)}}>
```

---

## 6. PostComments — Sistema de Engajamento (Referência)

**Cenário:** Documentação do sistema de comentários/likes/share já implementado em `src/components/blog/PostComments.tsx`.

**Padrão atual implementado:**

```yaml
Component: PostComments ({ slug })
Location: src/components/blog/PostComments.tsx
Lazy-loaded: yes (React.lazy in BlogPostPage)

Engagement Bar (Instagram-style):
  - Heart button: toggle like, persisted in localStorage
  - Comment button: MessageCircle icon, badge count overlay
  - Share button: Share2 icon → ShareDropdown (WhatsApp, Twitter, Facebook, Copy Link)
  - Likes count: "X curtidas" below icons

Auth: Google Identity Services (VITE_GOOGLE_CLIENT_ID)
  - Login required for: commenting, liking comments
  - Google button rendered via google.accounts.id.renderButton()
  - User object: { name, email, picture, credential }

Comments API:
  - GET /api/comments/:slug → CommentData[]
  - POST /api/comments/:slug (Bearer token) → new comment
  - POST /api/comments/:slug/:id/like (Bearer token) → { likes }

Sub-components (memo'd):
  - ShareDropdown: absolute positioned dropdown with social links
  - CommentItem: individual comment with avatar, timeAgo, like button

Design tokens used:
  - Card: bg-white/5 border-white/10 rounded-xl
  - Avatar fallback: bg-[#c9a44a]/20 text-[#c9a44a]
  - Input: bg-white/5 border-white/10 focus:ring-[#c9a44a]/50
  - Submit button: bg-[#c9a44a] text-[#0d1f33] hover:bg-[#d4b35a]
  - Auth gate: bg-white/5 rounded-xl border-white/10 with LogIn icon
```

---

## Regras para Novos Prompts

Ao criar prompts para este projeto, **sempre inclua:**

1. **Layout wrapper:** `min-h-screen bg-[#0d1f33]` → `<Header />` → `<main>` → `<Footer />`
2. **Cores exatas:** usar os hex codes das CSS vars (`#0d1f33`, `#c9a44a`, `#d4b55a`)
3. **Classes CSS existentes:** `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.article-card`, `.link-underline`
4. **Glassmorphism:** `bg-white/5 border border-white/10 rounded-xl`
5. **Animações:** usar as classes existentes (`.animate-fade-in-up`, `.animate-slide-up-fade`, etc.)
6. **Tipografia:** Orbitron para display (`.font-display`), Montserrat para corpo (padrão)
7. **Ícones:** `lucide-react` exclusivamente
8. **Config:** referenciar `CONTACT` e `DOCTOR` de `src/config/siteConfig.ts`
9. **Routing:** `react-router-dom` com slugs gerados por `generateSlug()`
10. **Performance:** `memo()`, `useCallback()`, `useMemo()`, `React.lazy()` + `Suspense`
