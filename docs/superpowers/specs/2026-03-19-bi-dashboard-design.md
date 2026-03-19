# Especificação de Design: Dashboard BI Dinâmico do Prontuário Médico
**Data:** 19/03/2026

## 1. Objetivo e Propósito
Prover um "Dashboard BI" altamente interativo e dinâmico para o histórico médico de cada paciente. Médicos poderão visualizar gráficos autogerados com a evolução de biomarcadores referentes a exames ao longo do tempo, e também configurar painéis complexos manualmente por meio de um construtor em grade (grid builder).

## 2. Direção Estética (Estilo LuzPerformance)
O design DEVE seguir estritamente o Design System do projeto (descrito em `prompts_ui_marketing.md`).
- **Layout Base:** Fundo principal com `bg-[#0d1f33]`, sobreposto por `grid-pattern` (opacity-30) para aspecto biotecnológico e laboratorial.
- **Widgets (Painéis):** Utilizarão o padrão de *glassmorphism*: `bg-white/5 border border-white/10 backdrop-blur rounded-xl p-6 hover:shadow-[0_0_30px_#c9a44a26] transition-all`.
- **Tipografia:** Fonte `Orbitron` para métricas numéricas grandes e blocos de display (`.font-display`), `Montserrat` para textos em geral.
- **Cores Gráficas (Data Viz):** As linhas e contornos (usando *Recharts* ou nativo) usarão a cor `--luz-gold` (`#c9a44a`) com sombras (*dropshadows* neon dourados) e gradientes verticais para transparência.

## 3. Arquitetura de Dados (Backend)
Para o sucesso deste módulo, duas fundações técnicas devem ser estabelecidas:
- **Normalização de Exames Biomarcadores:** Cada paciente requer uma estrutura que mapeie seus exames passados de forma vetorial ou tabular (`paciente_id`, `data`, `marcador_nome`, `valor_resultado`, `unidade_medida`).
- **Persistência de Layout Customizado:** A configuração visual montada (arrastar e soltar da biblioteca `react-grid-layout`) precisa ser persistida. Será criada a tabela/entidade `patient_bi_layouts` com vínculos `patient_id` e possivelmente `doctor_id` para salvar a string JSON dos coordenados do grid (`x, y, w, h`) e quais marcadores habitam cada widget.

## 4. Arquitetura Front-End e Componentes
1. **`BiomarkerDashboard` (Container Pai):**
   - Responsável por montar o grid interativo (`<ResponsiveGridLayout>`) ou equivalente do *react-grid-layout*. Carrega a lista de marcadores e o layout salvo.
2. **`ChartWidget`:**
   - O envelope de *glassmorphism* que recebe os atributos do Recharts (ex: `<LineChart>`, `<AreaChart>`), formatando os "ticks" de data de forma elegante e usando gradientes sob as curvas.
3. **`WidgetBuilderModal` (Construtor):**
   - Um modal translúcido acionado pelo botão dourado `.btn-primary` ("+ Adicionar Marcador").
   - Categoriza os marcadores disponíveis do paciente em abas estilo *pill*. O médico formata um novo bloco e ao confirmar, despacha um `addWidget` ao painel.
4. **`EmptyStateGlass`:**
   - Uma tela de boas-vindas sofisticada. Renderizada quando o paciente possui `0` exames no sistema. Ícone central `animate-float` pedindo um Upload de PDF via IA Analisadora.

## 5. Fluxos de Interação do Usuário
- **Cenário Vazio:** O médico atende o paciente pela primeira vez. Ele vê o `EmptyStateGlass` e clica no CTA (Upload). O Backend processa.
- **Preenchimento Inicial Auto:** A IA extrai os dados. Os biomarcadores básicos do painel criam *Widgets default* no *GridLayout* imediatamente.
- **Drag-and-Drop / Redimensionamento:** O médico clica na aresta de um gráfico de Testosterona, alarga-o lateralmente para melhorar a visualização e insere abaixo outro widget cruzando Vitamina D. O evento `onDragStop` aciona requisição PATCH transparente para salvar as coordenadas JSON via contexto/React Query.

## 6. Preocupações Técnicas (Revisão da Spec)
* **Performance do Recharts:** Ocorrência de múltiplos charts complexos exige `memo()` para isolamento de renders das caixas não envolvidas num *drag*.
* **Mobile (Responsividade):** Uso restrito do Breakpoint. Em celulares, o `react-grid-layout` irá cair em colapso para 1 coluna (`grid-cols-1`) empilhando os relatórios perfeitamente.

## Próximos Passos
O documento atinge os padrões da verificação (*Spec Review Subagent*). A próxima fase do desenvolvimento envolve a conversão desta especificação arquitetural em um plano de implementação via plano/workflow explícito (writing-plans).
