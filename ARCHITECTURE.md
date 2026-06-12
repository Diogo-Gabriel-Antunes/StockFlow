# ARCHITECTURE.md — StockFlow

## Visao geral

StockFlow e uma aplicacao SaaS multi-tenant composta por:

- Backend Quarkus/Java 21.
- Frontend Next.js/React/TypeScript.
- Banco PostgreSQL.
- Migrations Flyway.
- Nginx como proxy reverso.
- Docker Compose para ambiente local e producao por IP.

## Stack atual

### Backend

- Java 21.
- Quarkus.
- Jakarta REST.
- Hibernate ORM com Panache.
- Flyway.
- PostgreSQL em runtime.
- H2 nos testes.
- JUnit 5 e RestAssured.
- SmallRye OpenAPI/Swagger UI.
- Health checks Quarkus.
- OpenPDF para geracao de PDFs de proposta.

### Frontend

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- TanStack Query.
- React Hook Form e Zod.
- Vitest e React Testing Library.
- `sonner` para toast.
- Componentes UI locais.

### Infra

- Docker Compose local.
- Docker Compose de producao.
- Nginx.
- PostgreSQL com volume persistente.
- Scripts de deploy e backup em `infra/scripts`.

## Estrutura backend

Pacotes principais em `backend/src/main/java/com/stockflow`:

- `auth`: cadastro, login, `/auth/me`.
- `companies`: dados da empresa atual e configuracoes comerciais.
- `customers`: clientes.
- `products`: produtos.
- `services`: servicos.
- `stock`: estoque, movimentacoes e estoque baixo.
- `quotes`: orcamentos e regras internas.
- `publicquotes`: token publico, proposta publica e PDF.
- `customerportal`: portal publico do cliente por token.
- `quoterequests`: solicitacoes de orcamento do cliente e painel interno.
- `notifications`: notificacoes, historico de atividades e eventos de negocio.
- `replenishments`: reposicao/compras.
- `dashboard`: indicadores.
- `shared/security`: JWT, filtro de autenticacao e contexto multi-tenant.

## Estrutura frontend

Arquivos principais em `frontend/src`:

- `app`: rotas Next.js.
- `features/auth`: autenticacao.
- `features/customers`: clientes.
- `features/products`: produtos.
- `features/services`: servicos.
- `features/quotes`: orcamentos e proposta publica.
- `features/customer-portal`: portal do cliente, solicitacoes e painel interno de solicitacoes.
- `features/notifications`: sino, pagina de notificacoes e historico de atividades.
- `features/stock`: estoque, movimentacoes e baixo estoque.
- `features/replenishments`: reposicao/compras.
- `features/dashboard`: dashboard.
- `features/company-settings`: configuracoes comerciais da empresa.
- `components/layout`: layout autenticado, sidebar, protecao de rotas.
- `components/ui`: componentes visuais reutilizaveis.
- `services/http.ts`: cliente HTTP.
- `lib/toast.ts`: helper de notificacoes.

O frontend usa interface fixa em modo dark. O `RootLayout` aplica `className="dark"` diretamente no elemento `html`, e as variaveis globais de `globals.css` usam valores escuros como padrao para evitar flash claro no carregamento. Nao ha provider, toggle ou persistencia de tema em `localStorage`.

Novas telas devem usar os tokens Tailwind do projeto (`bg-page`, `bg-panel`, `text-ink`, `text-muted`, `border-border`) como base visual. Cores claras fixas podem aparecer apenas em variantes pontuais com contraste validado, nao como fundo principal da pagina ou de cards.

## Banco de dados e migrations

Migrations em `backend/src/main/resources/db/migration`:

- `V1__initial_schema.sql`
- `V2__companies_users_auth.sql`
- `V3__seed_default_owner_user.sql`
- `V4__customers.sql`
- `V5__products_services.sql`
- `V6__stock_movements.sql`
- `V7__quotes.sql`
- `V8__public_quote_tokens.sql`
- `V9__product_codes.sql`
- `V10__quote_completion_flow.sql`
- `V11__company_commercial_settings.sql`
- `V12__customer_portal_quote_requests.sql`
- `V13__notifications_activity_logs.sql`
- `V14__product_catalog_quote_request_products.sql`

Entidades operacionais usam `company_id` para isolamento multi-tenant.

## Regra de roteamento API

O backend nao usa `/api`.

O frontend chama `/api/*`.

O Nginx remove `/api` e encaminha para o backend.

Exemplo:

```txt
Frontend:
POST /api/auth/login

Nginx:
proxy_pass http://backend:8080/

Backend:
POST /auth/login
```

Rotas reais do backend:

- `/auth/login`
- `/auth/register`
- `/auth/me`
- `/customers`
- `/products`
- `/services`
- `/quotes`
- `/stock/movements`
- `/stock/replenishment`
- `/dashboard/summary`
- `/company/settings`
- `/public/customer-portal/{token}`
- `/public/customer-portal/{token}/products`
- `/public/customer-portal/{token}/products/search`
- `/public/customer-portal/{token}/products/{productId}`
- `/quote-requests`
- `/notifications`
- `/activity-logs`

Rotas Quarkus nao devem receber prefixo `/api`.

## Nginx

O Nginx possui duas responsabilidades principais:

1. Encaminhar `/api/` para o backend Quarkus removendo o prefixo.
2. Encaminhar `/` para o frontend Next.js.

Configuracao esperada:

```nginx
location /api/ {
    proxy_pass http://backend:8080/;
}

location / {
    proxy_pass http://frontend:3000;
}
```

Dentro do container Nginx, usar nomes de servico Docker (`backend`, `frontend`), nunca `localhost` para acessar outros containers.

## Swagger/OpenAPI

Rotas diretas no backend:

- `GET /q/openapi`
- `GET /q/swagger-ui`

Rotas via Nginx:

- `GET /api/q/openapi`
- `GET /api/q/swagger-ui`

O OpenAPI usa configuracao compatibilizada com proxy para funcionar via `/api`.

## Autenticacao e JWT

O backend usa JWT proprio via `JwtService`.

Fluxo:

1. Usuario faz login em `/auth/login`.
2. Backend retorna token.
3. Frontend armazena token conforme padrao atual.
4. Cliente HTTP envia `Authorization: Bearer TOKEN`.
5. `AuthFilter` valida token.
6. `AuthenticatedTenant` disponibiliza `userId` e `companyId`.

Endpoints publicos:

- Login.
- Cadastro.
- Proposta publica por token.
- Portal do cliente por token.
- Recursos Quarkus `/q/*`.

## Multi-tenant

Regra obrigatoria:

```txt
Todo dado interno deve ser filtrado pela empresa autenticada.
```

Padrao:

- Entidades possuem relacao com `CompanyEntity`.
- Repositories consultam por `company.id`.
- Services usam `AuthenticatedTenant.companyId()`.
- Endpoints internos exigem token.

Aplicar sempre em clientes, produtos, servicos, estoque, movimentacoes, orcamentos, dashboard e reposicao.

## Paginacao, busca e filtros

As listagens principais aceitam `page`, `size`, `search`, `sort` e `direction` quando aplicavel.

O tamanho padrao e `10`; o backend limita `size` a no maximo `100`.

O backend pagina no banco com Panache `Page.of(page, size)` e sempre filtra por `company.id` nos dados internos.

O contrato paginado preserva `items`, `page`, `size` e `total`, e tambem retorna `content`, `totalElements`, `totalPages`, `first` e `last`.

Campos de ordenacao sao mapeados por modulo nos repositories. Campos invalidos caem na ordenacao padrao, evitando usar valores arbitrarios da URL em JPQL.

Filtros implementados:

- Produtos: `search`, `active`, `lowStock`, `sort`, `direction`.
- Clientes: `search`, `sort`, `direction`.
- Servicos: `search`, `active`, `sort`, `direction`.
- Orcamentos: `search`, `status`, `customerId`, `dateFrom`, `dateTo`, `sort`, `direction`.
- Movimentacoes: `search`, `productId`, `type`, `dateFrom`, `dateTo`, `sort`, `direction`.
- Reposicao: `search`, `status`, `page`, `size`.

O frontend usa `PaginationControls` nas listagens principais para pagina atual, total de registros e seletor de itens por pagina.

## Dashboard Gerencial v2

O dashboard usa o pacote backend `com.stockflow.dashboard`.

Endpoint real do backend:

- `GET /dashboard/summary`

Rota via Nginx/frontend:

- `GET /api/dashboard/summary`

Parametros aceitos:

- `period`: `today`, `last7days`, `currentMonth`, `previousMonth` ou `custom`.
- `dateFrom`: data inicial para `period=custom`.
- `dateTo`: data final para `period=custom`.

O periodo padrao e `currentMonth`. Quando `period=custom`, `dateFrom` e `dateTo` sao obrigatorios e `dateFrom` deve ser menor ou igual a `dateTo`.

O DTO principal e `DashboardSummaryResponse`, com blocos aninhados:

- `period`: intervalo aplicado.
- `quotes`: totais, valores aprovado/em aberto e taxa de aprovacao.
- `stock`: contagem de estoque baixo e sem estoque.
- `customers`: total de clientes e clientes criados no periodo.
- `recentQuotes`.
- `recentCustomers`.
- `recentStockMovements`.
- `criticalProducts`.

O service usa `AuthenticatedTenant.companyId()` e todos os repositories filtram por `company.id`, inclusive agregacoes e listas recentes. As listas resumidas usam limite fixo de 5 registros.

## Configuracoes da Empresa / Perfil Comercial

As configuracoes comerciais usam a entidade existente `CompanyEntity` e a tabela `companies`. A migration `V11__company_commercial_settings.sql` adiciona os campos comerciais e os padroes de proposta sem criar uma segunda entidade de empresa.

Endpoint real do backend:

- `GET /company/settings`
- `PUT /company/settings`

Rotas via Nginx/frontend:

- `GET /api/company/settings`
- `PUT /api/company/settings`

DTOs principais:

- `CompanySettingsResponse`
- `UpdateCompanySettingsRequest`

O service `CompanySettingsService` usa `AuthenticatedTenant.companyId()` para buscar e atualizar exclusivamente a empresa autenticada. O payload nao expoe nem aceita troca de `companyId`.

Os campos comerciais sao usados em tres pontos:

- PDF de proposta: `QuotePdfService` usa nome comercial, razao social, documento, contato e endereco quando disponiveis.
- Proposta publica: `PublicQuoteResponse` expoe apenas os dados comerciais necessarios para a pagina publica.
- Novos orcamentos: `QuoteService` aplica validade, observacoes e condicoes de pagamento padrao quando o payload nao informa esses valores.

Upload de logo, storage de arquivos e templates customizaveis nao fazem parte da v1.

## Portal do Cliente v1

O Portal do Cliente usa o pacote backend `com.stockflow.customerportal` para endpoints publicos por token e o pacote `com.stockflow.quoterequests` para solicitacoes de orcamento.

Campos adicionados em `customers`:

- `portal_token`
- `portal_enabled`
- `portal_token_created_at`

Entidades novas:

- `QuoteRequestEntity` em `quote_requests`.
- `QuoteRequestItemEntity` em `quote_request_items`.

Campos relevantes adicionados:

- `products.description`: descricao opcional exibida no catalogo publico.
- `products.image_url`: URL opcional de imagem do produto, sem upload/storage nesta v1.
- `quote_request_items.product_id`: referencia opcional ao produto selecionado.
- `quote_request_items.product_name_snapshot`, `product_sku_snapshot`, `product_reference_snapshot`, `product_image_url_snapshot`: snapshot do produto no momento da solicitacao.

Status de solicitacao:

- `REQUESTED`
- `IN_REVIEW`
- `CONVERTED_TO_QUOTE`
- `CANCELLED`

Endpoints publicos reais:

- `GET /public/customer-portal/{token}`
- `GET /public/customer-portal/{token}/quotes`
- `GET /public/customer-portal/{token}/quotes/{quoteId}`
- `POST /public/customer-portal/{token}/quotes/{quoteId}/approve`
- `POST /public/customer-portal/{token}/quotes/{quoteId}/reject`
- `GET /public/customer-portal/{token}/quotes/{quoteId}/pdf`
- `GET /public/customer-portal/{token}/products`
- `GET /public/customer-portal/{token}/products/search`
- `GET /public/customer-portal/{token}/products/{productId}`
- `GET /public/customer-portal/{token}/quote-requests`
- `GET /public/customer-portal/{token}/quote-requests/{requestId}`
- `POST /public/customer-portal/{token}/quote-requests`
- `PUT /public/customer-portal/{token}/quote-requests/{requestId}`
- `POST /public/customer-portal/{token}/quote-requests/{requestId}/cancel`

Endpoints internos reais:

- `GET /quote-requests`
- `GET /quote-requests/{id}`
- `PUT /quote-requests/{id}/status`
- `POST /quote-requests/{id}/convert-to-quote`

Seguranca publica:

- O token identifica um unico cliente ativo com portal habilitado.
- Endpoints publicos nunca aceitam `companyId` ou `customerId`.
- Buscas de proposta e solicitacao sempre partem do cliente encontrado pelo token.
- Rascunhos internos (`DRAFT`) nao sao expostos pelo portal.
- DTOs publicos nao incluem preco de custo, estoque interno, margem ou movimentacoes.
- O catalogo e o autocomplete publico retornam somente produtos ativos da empresa do cliente identificado pelo token.
- Produto inativo, inexistente ou de outra empresa nao pode ser referenciado em solicitacao pelo portal.

Conversao de solicitacao:

- `QuoteRequestService` cria um `QuoteEntity` em `DRAFT`, vinculado ao cliente e empresa da solicitacao.
- Os itens da solicitacao sao registrados nas observacoes do orcamento, com snapshots de produtos quando houver.
- A empresa adiciona produtos/servicos e precos manualmente depois.
- A conversao nao altera estoque.

Frontend:

- Portal publico: `frontend/src/app/customer-portal/[token]`.
- Detalhe de proposta: `frontend/src/app/customer-portal/[token]/quotes/[quoteId]`.
- Nova solicitacao: `frontend/src/app/customer-portal/[token]/quote-requests/new`.
- Edicao/leitura de solicitacao: `frontend/src/app/customer-portal/[token]/quote-requests/[requestId]`.
- Painel interno: `frontend/src/app/quote-requests`.

## Central de Notificacoes e Historico de Atividades v1

A central usa o pacote backend `com.stockflow.notifications`.

Entidades novas:

- `NotificationEntity` em `notifications`.
- `ActivityLogEntity` em `activity_logs`.

Services principais:

- `NotificationService`: cria, lista, conta nao lidas e marca notificacoes como lidas.
- `ActivityLogService`: registra e lista atividades da empresa autenticada.
- `BusinessEventService`: ponto central para hooks de eventos de propostas, portal, solicitacoes, estoque e reposicao.

Endpoints reais do backend:

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`
- `GET /activity-logs`

Rotas via Nginx/frontend:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `POST /api/notifications/{id}/read`
- `POST /api/notifications/read-all`
- `GET /api/activity-logs`

Modelo v1:

- Notificacoes sao escopadas por empresa, nao por usuario individual.
- `read_at` marca a notificacao como lida para a empresa toda.
- Atividades registram ator `INTERNAL_USER`, `CUSTOMER` ou `SYSTEM`.
- Endpoints internos usam o fluxo normal de JWT e `AuthenticatedTenant.companyId()`.
- Eventos publicos por token usam a empresa do cliente/proposta resolvida pelo token.

Eventos conectados:

- Aprovacao e recusa publica de proposta.
- Criacao, cancelamento e conversao de solicitacao de orcamento.
- Conclusao interna de orcamento.
- Movimentacoes que cruzam para estoque baixo ou zero.
- Registro de reposicao.

Para evitar spam, os eventos `STOCK_LOW` e `STOCK_OUT` sao emitidos apenas quando a quantidade cruza o limite. Movimentacoes posteriores enquanto o produto ja esta abaixo do minimo ou zerado nao geram repeticoes desse mesmo evento.

Frontend:

- Sino no layout autenticado via `NotificationBell`.
- Servico HTTP em `features/notifications/notification-service.ts`.
- Pagina interna `/notifications`.
- Pagina interna `/activity-logs`.
- Sem WebSocket nesta v1; o sino carrega ao montar e faz polling leve de contador a cada 60 segundos.

## Fluxo de requisicoes

### Ambiente via Nginx

```txt
Browser
  -> /api/products
  -> Nginx remove /api
  -> Backend recebe /products
```

### Ambiente backend direto

```txt
curl http://localhost:8080/products
```

## Orcamentos e estoque

Fluxo de status:

```txt
DRAFT -> SENT -> CUSTOMER_APPROVED -> COMPLETED
```

Regras:

- Aprovacao publica nao baixa estoque.
- Aprovacao manual como cliente nao baixa estoque.
- Conclusao interna baixa estoque.
- Conclusao interna cria movimentacoes `SALE`.
- Servicos nao baixam estoque.
- Produtos repetidos sao agregados antes da validacao.
- `stockDeducted` protege contra baixa duplicada.

## PDF de proposta/orcamento

A geracao de PDF e feita no backend Quarkus com a biblioteca OpenPDF (`com.github.librepdf:openpdf`).

O servico responsavel e `com.stockflow.publicquotes.QuotePdfService`.

O PDF e gerado sob demanda em memoria a partir do orcamento, empresa, cliente, itens e totais. A resposta encapsula os bytes e o nome do arquivo em `QuotePdfResponse`.

Os dados da empresa no PDF sao resolvidos a partir das configuracoes comerciais da propria `CompanyEntity`. Campos vazios sao ignorados para evitar linhas em branco. Observacoes e condicoes de pagamento usam primeiro os valores do orcamento e, se estiverem vazios, os padroes configurados na empresa.

Nao ha storage de PDF nesta fase. Os arquivos nao sao persistidos em disco, MinIO ou S3, e nao ha historico de PDFs gerados.

Endpoints reais do backend:

- `GET /quotes/{id}/pdf`
- `GET /public/quotes/{token}/pdf`
- `GET /public/customer-portal/{token}/quotes/{quoteId}/pdf`

Rotas via Nginx/frontend:

- `GET /api/quotes/{id}/pdf`
- `GET /api/public/quotes/{token}/pdf`
- `GET /api/public/customer-portal/{token}/quotes/{quoteId}/pdf`

As respostas usam:

```txt
Content-Type: application/pdf
Content-Disposition: inline; filename="proposta-{codigo}.pdf"
```

Seguranca:

- O endpoint interno passa pelo fluxo normal de autenticacao JWT e usa `AuthenticatedTenant.companyId()` ao buscar o orcamento.
- Usuario autenticado so recebe PDF de orcamento da propria empresa.
- O endpoint publico nao exige login, mas busca a proposta exclusivamente pelo token publico valido.
- Token invalido nao expoe dados e retorna erro conforme o padrao atual.

Swagger/OpenAPI documenta os endpoints com retorno `application/pdf`.

## Reposicao / Compras v1

A reposicao simples usa o pacote backend `com.stockflow.replenishments`.

O servico responsavel e `ReplenishmentService`, que lista produtos criticos da empresa autenticada e delega a entrada de estoque para `StockService.entryWithReference`.

Endpoints reais do backend:

- `GET /stock/replenishment`
- `POST /stock/replenishment/{productId}/restock`

Rotas via Nginx/frontend:

- `GET /api/stock/replenishment`
- `POST /api/stock/replenishment/{productId}/restock`

Rotas legadas de compatibilidade:

- `GET /replenishments`
- `POST /replenishments/entries`

Regras tecnicas:

- Os endpoints internos passam pelo filtro JWT.
- Produtos sao consultados pela empresa autenticada.
- Apenas produtos ativos com `stockQuantity <= minimumStock` aparecem.
- A sugestao e calculada em `ReplenishmentCalculator`.
- Se o estoque estiver abaixo do minimo, a sugestao e a diferenca ate o minimo.
- Se o estoque estiver exatamente no minimo, a sugestao e `1`.
- O registro de reposicao e transacional.
- A reposicao cria movimentacao `IN` com `referenceType=REPLENISHMENT`.
- Nao ha entidade de pedido de compra, fornecedor ou workflow de compra nesta fase.

Frontend:

- A tela fica em `frontend/src/app/stock/replenishment/page.tsx`.
- O componente principal e `features/replenishments/ReplenishmentsPage`.
- O cliente HTTP usa `/api` indiretamente pelo `apiRequest`.
- A UI usa modal local e toast, sem `window.alert` ou `window.confirm`.

## Estrategia de erros

Estado atual:

- Backend usa excecoes JAX-RS e Bean Validation.
- Ainda nao ha envelope global unico para todos os erros.
- Frontend usa `getApiErrorMessage` para extrair mensagem amigavel e evitar exibir HTML/erro tecnico cru.

Pendencia recomendada:

- Criar padrao global de erro no backend, por exemplo:

```json
{
  "message": "Mensagem amigavel",
  "details": []
}
```

## Estrategia de testes

### Backend

- Testes Quarkus com JUnit 5 e RestAssured.
- Testes de recursos por modulo.
- Testes de regras de calculo em services/calculators.
- H2 em perfil de teste.

### Frontend

- Vitest.
- React Testing Library.
- Testes de paginas, formularios, layout, toast e modal.

### Comandos

Backend:

```bash
mvn -B test
```

Frontend:

```bash
npm test
npm run lint
npm run build
```

Docker:

```bash
docker compose down
docker compose up -d --build
docker compose ps
```

## Decisoes tecnicas importantes

- Backend nao usa `/api`; Nginx e responsavel pelo prefixo publico.
- Dados internos sao isolados por empresa.
- Produtos controlam estoque; servicos nao.
- Toda alteracao de estoque gera movimentacao.
- Aprovacao publica de proposta nao baixa estoque.
- Conclusao interna do orcamento baixa estoque.
- PDF de proposta e gerado sob demanda pelo backend, sem storage nesta fase.
- Reposicao / Compras v1 registra entrada de estoque, nao pedido de compra completo.
- Configuracoes da Empresa v1 ficam na entidade `CompanyEntity` e alimentam PDF, proposta publica e padroes de novos orcamentos.
- Portal do Cliente v1 usa token publico vinculado ao cliente, sem login/senha de cliente.
- Cliente cria solicitacoes de orcamento, mas nao edita propostas oficiais enviadas.
- Nao usar `window.alert` ou `window.confirm`; usar toast e modal.
- Preferir menor alteracao segura e padroes existentes.

Consulte tambem `DECISIONS.md`.
