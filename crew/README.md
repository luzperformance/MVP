# Prontuário Crew

Agentes CrewAI com Claude que constroem o sistema de prontuário médico LuzPerformance.

## Agentes

| Agente | Responsabilidade |
|--------|-----------------|
| `analista` | Lê o projeto, identifica o que está feito e o que falta |
| `auth_agent` | Melhora autenticação: rotas /me, /refresh, /logout, audit log |
| `backend_agent` | Implementa módulos backend faltantes (agenda, financeiro, etc.) |
| `frontend_agent` | Implementa páginas e componentes React faltantes |
| `qa_agent` | Revisão de segurança LGPD e qualidade de código |

## Setup

```bash
cd D:\MVP\crew

# 1. Criar ambiente virtual Python
python -m venv venv
venv\Scripts\activate      # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis
copy .env.example .env
# editar .env com ANTHROPIC_API_KEY
```

## Uso

```bash
# Ciclo completo (analisa + implementa tudo)
python main.py

# Apenas análise do projeto
python main.py --task analyze

# Apenas autenticação
python main.py --task auth

# Apenas backend
python main.py --task backend

# Apenas frontend
python main.py --task frontend

# Apenas revisão de segurança
python main.py --task qa
```

## Fluxo

```
analyze → auth → backend → frontend → qa
```

Cada tarefa passa o contexto para a próxima.
Os agentes leem e escrevem arquivos diretamente no projeto D:\MVP.

## Arquivos de Referência

Os arquivos em `C:\Users\luzar\Downloads\file` servem de referência
para o `auth_agent` implementar as melhorias de autenticação.
