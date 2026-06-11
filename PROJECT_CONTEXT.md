# PROJECT_CONTEXT.md — StockFlow

## Objetivo do arquivo

Este arquivo e a fonte rapida de contexto do projeto para futuras tarefas com Codex.

Antes de implementar qualquer alteracao, leia este arquivo junto com:

- `SPEC.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`

## Produto

StockFlow e um SaaS de gestao comercial para pequenos negocios, com foco em:

- Clientes.
- Produtos.
- Servicos.
- Estoque.
- Orcamentos.
- Propostas.
- Dashboard Gerencial v2.

## Stack

- Backend: Quarkus + Java 21.
- Frontend: Next.js/React + TypeScript.
- Banco: PostgreSQL.
- Migrations: Flyway.
- Proxy: Nginx.
- Deploy local: Docker Compose.
- Testes backend: JUnit 5 + RestAssured.
- Testes frontend: Vitest + React Testing Library.

## Estado atual

### Implementado

- Autenticacao com cadastro, login, JWT e `/auth/me`.
- Empresas e contexto multi-tenant.
- Clientes.
- Produtos com `barcode` e `referenceCode` opcionais.
- Servicos.
- Estoque com entrada, saida, ajuste e historico.
- Estoque baixo.
- Reposicao / Compras v1.
- Tela de reposicao em `/stock/replenishment`.
- Sugestao simples de reposicao para produtos ativos no estoque minimo ou abaixo dele.
- Registro rapido de reposicao como entrada de estoque.
- Reposicao gera movimentacao de estoque com referencia `REPLENISHMENT`.
- Orcamentos com produtos e servicos.
- Link publico de proposta.
- Geracao de PDF profissional de proposta/orcamento sob demanda, sem storage.
- Endpoint interno autenticado `GET /quotes/{id}/pdf` para PDF, respeitando empresa/multi-tenant.
- Endpoint publico `GET /public/quotes/{token}/pdf` para PDF por token publico valido.
- Botao de PDF no detalhe interno do orcamento.
- Botao de PDF na proposta publica.
- Fluxo de orcamento separado entre aprovacao do cliente e conclusao interna.
- Conclusao interna de orcamento com baixa de estoque e protecao contra baixa duplicada.
- Dashboard.
- Configuracoes da Empresa / Perfil Comercial v1.
- Toast profissional.
- Modal de confirmacao profissional.
- Paginacao visual nas listagens principais.
- Busca e filtros em produtos, clientes, servicos, orcamentos, movimentacoes e reposicao.
- Resposta paginada padronizada com `items`, `content`, `page`, `size`, `total`, `totalElements`, `totalPages`, `first` e `last`.
- Componente frontend `PaginationControls` para pagina atual, total e itens por pagina.
- Endpoint `GET /dashboard/summary` com filtros `period`, `dateFrom` e `dateTo`.
- Indicadores do dashboard por periodo: orcamentos, valores aprovado/em aberto, taxa de aprovacao, clientes cadastrados e estoque critico.
- Dashboard exibe ultimos orcamentos, ultimos clientes, ultimas movimentacoes e produtos criticos.
- Endpoint `GET /company/settings` e `PUT /company/settings`.
- Dados comerciais da empresa para PDF e proposta publica.
- Observacoes, condicoes de pagamento e validade padrao para novos orcamentos.
- Docker Compose, Nginx, Swagger/OpenAPI e health checks.

### Parcial

- Ordenacao interativa em cabecalhos de tabela ainda nao foi implementada; o backend aceita `sort` e `direction` seguros.
- Deploy VPS: arquivos existem; falta validacao em VPS real e restore de backup.
- PDF/proposta publica: funcional com layout profissional inicial; ainda pode evoluir visualmente.

### Pendente

- Envelope global de erro da API.
- Ambiente demo dedicado.
- Formulario real de interesse.
- Botao WhatsApp.
- HTTPS com dominio.
- Storage de PDFs em MinIO/S3 ou historico de PDFs gerados.

## Regras criticas

### API

Backend nao usa `/api`.

Frontend chama `/api`.

Nginx remove `/api`.

Exemplo:

```txt
Frontend: /api/auth/login
Backend real: /auth/login
```

### Multi-tenant

Todo dado interno deve respeitar empresa autenticada.

Usuario so pode acessar dados da propria empresa.

### Produtos e servicos

Produtos possuem estoque.

Servicos nao possuem estoque.

Servicos nao baixam estoque.

### Estoque

Toda alteracao de estoque gera movimentacao.

Estoque nao pode ficar negativo.

Produtos abaixo do minimo aparecem em estoque baixo/dashboard.

Reposicao / Compras v1 lista produtos ativos com `stockQuantity <= minimumStock`.

Se `stockQuantity < minimumStock`, a sugestao e `minimumStock - stockQuantity`.

Se `stockQuantity == minimumStock`, a sugestao e `1`.

Reposicao rapida usa entrada de estoque e gera movimentacao `IN` com referencia `REPLENISHMENT`.

### Orcamentos

Fluxo correto:

```txt
DRAFT -> SENT -> CUSTOMER_APPROVED -> COMPLETED
```

Labels:

```txt
Rascunho -> Enviado -> Aprovado pelo cliente -> Concluido
```

Aprovacao publica nao baixa estoque.

Aprovacao manual como cliente nao baixa estoque.

Conclusao interna baixa estoque.

Estoque nao pode ser baixado duas vezes.

Servicos sao ignorados na baixa.

PDF de proposta/orcamento e gerado sob demanda pelo backend.

Novos orcamentos usam `defaultQuoteValidityDays`, `defaultQuoteNotes` e `defaultPaymentTerms` da empresa quando esses campos nao sao informados no payload.

Campos informados diretamente no orcamento sempre tem prioridade sobre os padroes da empresa.

O PDF nao e salvo em MinIO/S3 nesta fase.

O endpoint interno de PDF exige autenticacao e respeita empresa autenticada.

O endpoint publico de PDF exige token publico valido.

PDF e proposta publica usam `tradeName` como nome principal quando configurado; caso contrario usam o nome da empresa.

### UX

Nao usar alert nativo.

Nao usar confirm nativo.

Usar toast e modal profissional.

## Padrao para novas tarefas

Antes de implementar:

1. Ler `PROJECT_CONTEXT.md`.
2. Ler `SPEC.md`.
3. Ler `ROADMAP.md`.
4. Ler `ARCHITECTURE.md`.
5. Ler `DECISIONS.md`.
6. Auditar codigo atual.
7. Nao duplicar endpoints.
8. Nao criar arquitetura paralela.
9. Nao alterar regras existentes sem necessidade.
10. Fazer a menor alteracao segura.
11. Criar ou ajustar testes.
12. Rodar build/testes quando possivel.

## Proxima prioridade recomendada

1. Padronizar envelope de erro do backend.
2. Melhorar ordenacao interativa nas tabelas.
3. Melhorar filtros analiticos futuros quando houver necessidade comercial.
4. Evoluir Reposicao / Compras para pedido de compra completo quando houver necessidade comercial.
