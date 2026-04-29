---
name: prontuario-hormonal-mvc
description: >-
  Projeta e implementa um sistema interno de prontuário eletrónico em arquitetura MVC (React + Express + API REST) para um único médico em terapias hormonais e medicina de performance, alinhado ao repositório luzperformance/MVP quando aplicável. Cobre modelos de dados (paciente, consultas SOAP, protocolos, exames, prescrições), fluxos de consulta, segurança e LGPD. Usar quando o usuário pedir prontuário, EMR interno, app para clínica hormonal/performance, evolução do MVP Luz Performance, ou modelagem de domínio clínico single-tenant.
---

# Prontuário MVC — hormonal e performance (médico único)

## Contexto

- **Utilizador:** um profissional (single-tenant), sem multi-clínica no MVP.
- **Domínio:** terapias hormonais e optimização de performance (TRT, protocolos, ajustes por biomarcadores, acompanhamento longitudinal).
- **Arquitectura:** MVC no sentido de separação de responsabilidades — **View** = React (`frontend/`); **Controller** = routers Express (`backend/src/routes/`); **Model** = SQLite/PG + serviços (`backend/src/db/`, `backend/src/services/`). O repositório canónico é **[luzperformance/MVP](https://github.com/luzperformance/MVP)**.

O agente deve **ler** [reference-mvp-alignment.md](reference-mvp-alignment.md) para prefixos de API, stack e entidades antes de propor alterações grandes.

## Princípios de modelagem

1. **Paciente como agregado central** — identificador estável, consentimentos, contacto de emergência, alergias e contra-indicações em destaque.
2. **Linha do tempo clínica** — consultas e notas ligadas a datas; exames laboratoriais versionados por data de colheita (não só “último valor”).
3. **Protocolo hormonal** — esquema actual (substâncias, vias, frequências), datas de início/ajuste, notas de titulação; evitar texto livre sem estrutura mínima.
4. **Performance / lifestyle** (se no âmbito do MVP) — sono, treino, nutrição como campos opcionais ou módulo separado para não poluir o núcleo clínico.
5. **Auditoria** — quem criou/editou registos sensíveis e quando (mesmo com um só utilizador, prepara evolução e cumprimento normativo).

## Camadas MVC (orientação)

| Camada | Responsabilidade |
|--------|------------------|
| **Model** | Entidades, validações de negócio, repositórios, políticas (ex.: não apagar consulta sem confirmação). |
| **View** | Formulários e listagens; máscaras para datas e unidades; mensagens de erro compreensíveis ao clínico. |
| **Controller** | Rotas REST ou equivalente, sessão/autenticação do único utilizador, CSRF onde aplicável, paginação de listas. |

Preferir **controllers finos** e regras no **model** ou serviços de domínio explícitos.

## Segurança e privacidade (mínimo exigível)

- Dados de saúde em repouso: preferir base com encriptação suportada e segredos fora do código.
- Transporte: HTTPS em qualquer deploy que não seja localhost isolado.
- Backups: estratégia declarada (frequência, localização, teste de restauro).
- Se o contexto for Brasil: referenciar **LGPD** e boas práticas ANVISA/CFM quando o usuário pedir conformidade formal; o agente não substitui assessoria jurídica.

## Fluxo de trabalho para o agente

Quando o pedido for implementar ou alterar o sistema:

1. Confirmar stack com **reference-mvp-alignment.md** (React, Express, SQLite/PG, Gemini).
2. Listar entidades e relações num diagrama ou lista antes de código grande.
3. Implementar migrações/schema antes das views críticas.
4. Incluir validações no modelo e mensagens claras na view.
5. Manter **SOAP** e rotas `/api/patients` coerentes com o MVP; actualizar `reference-mvp-alignment.md` se o upstream mudar tabelas ou prefixos.

## O que não fazer

- Não assumir multi-utilizador com papéis complexos no MVP sem pedido explícito.
- Não misturar dados clínicos com analytics públicos ou partilha externa sem requisitos claros.
- Não divergir da API pública do MVP sem migração ou feature flag documentada.

## Referências

- Alinhamento ao repositório [luzperformance/MVP](https://github.com/luzperformance/MVP): [reference-mvp-alignment.md](reference-mvp-alignment.md)
