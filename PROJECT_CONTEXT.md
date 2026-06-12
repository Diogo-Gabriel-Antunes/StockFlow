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
- Produtos com `imageUrl` opcional por URL, sem upload de arquivo nesta v1.
- Produtos com ativo/inativo exposto no cadastro interno.
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
- Portal do Cliente v1.
- Proposta Publica v2.
- Central de Notificacoes v1.
- Historico de Atividades v1.
- Geracao de PDF profissional de proposta/orcamento sob demanda, sem storage.
- Endpoint interno autenticado `GET /quotes/{id}/pdf` para PDF, respeitando empresa/multi-tenant.
- Endpoint publico `GET /public/quotes/{token}/pdf` para PDF por token publico valido.
- Botao de PDF no detalhe interno do orcamento.
- Botao de PDF na proposta publica.
- Fluxo de orcamento separado entre aprovacao do cliente e conclusao interna.
- Conclusao interna de orcamento com baixa de estoque e protecao contra baixa duplicada.
- Dashboard.
- Configuracoes da Empresa / Perfil Comercial v1.
- Sino de notificacoes no layout autenticado, contador de nao lidas e paginas `/notifications` e `/activity-logs`.
- Toast profissional.
- Modal de confirmacao profissional.
- Interface fixa em modo dark, sem alternancia para modo claro/sistema.
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
- Token publico seguro vinculado ao cliente para acesso a `/customer-portal/{token}`.
- Portal do cliente lista propostas em aberto e historico do proprio cliente.
- Portal do cliente permite aprovar/recusar propostas enviadas e baixar PDF sem login.
- Portal do cliente permite criar, editar enquanto aberta e cancelar solicitacoes de orcamento.
- Portal do cliente possui catalogo publico de produtos ativos da empresa do token.
- Portal do cliente possui autocomplete publico de produtos ativos para solicitacoes.
- Solicitacoes de orcamento podem misturar produto cadastrado selecionado e item manual.
- Itens de solicitacao com produto salvam `productId` e snapshot de nome, SKU, referencia e imagem.
- Painel interno `/quote-requests` lista solicitacoes, permite marcar em analise, cancelar e converter em orcamento rascunho.
- Eventos importantes de propostas, portal, solicitacoes, estoque e reposicao geram notificacao por empresa e historico de atividade.
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

Produto inativo permanece no historico interno, mas nao aparece no catalogo publico nem no autocomplete do portal.

Imagem de produto nesta v1 usa apenas `imageUrl` opcional; nao ha upload nem storage.

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

Recusa publica nao baixa estoque.

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

### Portal do cliente

O Portal do Cliente v1 usa token publico seguro vinculado ao cliente.

Nao existe login/senha de cliente nesta versao.

O cliente pode:

- Ver apenas dados e propostas vinculados ao proprio token.
- Ver catalogo de produtos ativos da empresa vinculada ao token.
- Selecionar produto ativo no autocomplete ao criar solicitacao.
- Aprovar ou recusar propostas em status `SENT`.
- Baixar PDF de propostas proprias.
- Criar solicitacoes de orcamento.
- Editar ou cancelar solicitacoes apenas enquanto estiverem `REQUESTED`.

O cliente nao pode:

- Ver rascunhos internos (`DRAFT`).
- Editar proposta oficial enviada.
- Alterar itens, precos ou totais de propostas.
- Concluir orcamento.
- Baixar estoque.
- Ver preco de custo, estoque interno ou produtos inativos.
- Alterar cadastro de produto.

Solicitacoes de orcamento usam status:

```txt
REQUESTED -> IN_REVIEW -> CONVERTED_TO_QUOTE
```

Tambem existe `CANCELLED`.

Conversao de solicitacao cria um orcamento oficial em `DRAFT`, vinculado ao cliente, com os itens descritos nas observacoes para a empresa revisar e precificar manualmente.

Quando a solicitacao possui produto selecionado, a conversao preserva a referencia e o snapshot nas observacoes do orcamento rascunho; a empresa revisa antes de enviar.

### Notificacoes e atividades

A Central de Notificacoes v1 e escopada por empresa, nao por usuario individual.

Endpoints internos:

```txt
GET /notifications
GET /notifications/unread-count
POST /notifications/{id}/read
POST /notifications/read-all
GET /activity-logs
```

Tipos principais:

```txt
QUOTE_APPROVED
QUOTE_REJECTED
QUOTE_COMPLETED
QUOTE_REQUEST_CREATED
QUOTE_REQUEST_CANCELLED
QUOTE_REQUEST_CONVERTED
STOCK_LOW
STOCK_OUT
RESTOCK_REGISTERED
```

Eventos publicos por token geram notificacoes para a empresa correta e atividades com ator `CUSTOMER`.

Eventos internos geram atividades com ator `INTERNAL_USER` ou `SYSTEM`, conforme o fluxo.

Estoque baixo e produto sem estoque evitam spam: a notificacao e criada apenas quando o produto cruza o limite de estoque normal para baixo/zero.

Nao ha WebSocket, e-mail, WhatsApp ou notificacao push nesta v1; o frontend carrega por requisicoes normais e pode fazer polling leve.

### UX

O frontend funciona somente em modo dark.

Nao existe alternancia visual entre modo claro, escuro ou sistema.

Novas telas e features devem ser implementadas diretamente em dark mode, usando os tokens de tema (`bg-page`, `bg-panel`, `text-ink`, `text-muted`, `border-border`) em vez de cores claras fixas como base visual.

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
