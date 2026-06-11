# DECISIONS.md — StockFlow

## Objetivo

Registrar decisoes importantes para evitar mudancas contraditorias no futuro.

## Decisao 001 — Prefixo /api

O backend Quarkus nao possui `/api` nas rotas reais.

O prefixo `/api` e responsabilidade do Nginx.

Frontend chama `/api/*`.

Nginx remove `/api`.

Backend recebe `/*`.

Exemplo:

```txt
/api/auth/login -> /auth/login
```

## Decisao 002 — Multi-tenant por empresa

O isolamento de dados e feito por empresa.

Todo dado operacional deve ser filtrado pela empresa autenticada.

Services devem obter `companyId` pelo contexto autenticado e repositories devem filtrar por `company.id`.

## Decisao 003 — Produtos e servicos

Produtos controlam estoque.

Servicos nao controlam estoque.

Servicos podem entrar em orcamentos, mas nao geram movimentacao de estoque.

## Decisao 004 — Estoque

Toda alteracao de estoque deve gerar movimentacao.

Estoque nao pode ficar negativo.

Movimentacoes devem registrar quantidade anterior, nova quantidade, motivo, usuario e referencia quando houver.

## Decisao 005 — Fluxo de orcamento

A aprovacao publica do cliente nao baixa estoque.

A aprovacao manual como cliente nao baixa estoque.

A baixa de estoque acontece somente na conclusao interna do orcamento.

Fluxo principal:

```txt
DRAFT -> SENT -> CUSTOMER_APPROVED -> COMPLETED
```

Labels:

```txt
Rascunho -> Enviado -> Aprovado pelo cliente -> Concluido
```

## Decisao 006 — Protecao contra baixa duplicada

Orcamento concluido nao pode baixar estoque novamente.

A protecao atual usa `stockDeducted`.

Conclusao interna deve validar todos os itens antes de alterar qualquer estoque.

Produtos repetidos no orcamento devem ser agregados antes da validacao.

Servicos devem ser ignorados.

## Decisao 007 — Feedback visual

Nao usar `window.alert`.

Nao usar `alert`.

Nao usar `window.confirm`.

Nao usar `confirm`.

Usar toast para mensagens.

Usar modal profissional para confirmacoes.

## Decisao 008 — Menor alteracao segura

Novas tarefas devem respeitar a estrutura atual do projeto.

Nao criar arquitetura paralela.

Nao duplicar endpoints.

Nao reescrever modulos inteiros sem necessidade.

Preferir padroes ja existentes no codigo.

## Decisao 009 — Flyway como fonte de schema

Alteracoes de banco devem ser feitas por migrations Flyway.

Nao usar `hibernate-orm.database.generation` para atualizar schema em runtime.

## Decisao 010 — Swagger/OpenAPI

Swagger deve continuar disponivel no backend em:

- `/q/openapi`
- `/q/swagger-ui`

Via Nginx:

- `/api/q/openapi`
- `/api/q/swagger-ui`

## Decisao 011 — Reposicao / Compras

Reposicao usa produtos abaixo do minimo.

Entrada registrada por reposicao deve gerar movimentacao de estoque com referencia `REPLENISHMENT`.

A primeira versao de Reposicao / Compras nao cria pedido de compra.

Ela apenas lista produtos ativos no estoque minimo ou abaixo dele, sugere quantidade e registra entrada de estoque.

Produtos exatamente no estoque minimo aparecem com sugestao `1`.

Os endpoints principais sao:

- `GET /stock/replenishment`
- `POST /stock/replenishment/{productId}/restock`

As rotas legadas `/replenishments` e `/replenishments/entries` permanecem apenas por compatibilidade.

Fornecedores, pedido de compra completo, status de compra, recebimento parcial e historico avancado ficam para futuras evolucoes.

## Decisao 012 — Paginacao

As listagens principais usam resposta paginada padronizada.

O contrato preserva os campos historicos:

- `items`
- `page`
- `size`
- `total`

E tambem expoe campos adicionais para compatibilidade com UIs paginadas:

- `content`
- `totalElements`
- `totalPages`
- `first`
- `last`

O tamanho padrao e `10` e o tamanho maximo aceito e `100`.

Campos de ordenacao vindos da URL devem ser mapeados por modulo; nao aceitar campos arbitrarios diretamente.

## Decisao 013 — PDF sob demanda

A primeira versao profissional do PDF da proposta e gerada sob demanda pelo backend.

Os arquivos PDF nao sao salvos em storage nesta fase.

O endpoint interno `GET /quotes/{id}/pdf` exige autenticacao e respeita empresa/multi-tenant.

O endpoint publico `GET /public/quotes/{token}/pdf` exige token publico valido e nao exige login.

Storage como MinIO/S3, historico de PDFs gerados, envio por e-mail e templates customizaveis ficam para futuras evolucoes.

## Decisao 014 — Dashboard Gerencial v2

O endpoint `GET /dashboard/summary` retorna indicadores em blocos aninhados:

- `period`
- `quotes`
- `stock`
- `customers`
- `recentQuotes`
- `recentCustomers`
- `recentStockMovements`
- `criticalProducts`

O periodo padrao e `currentMonth`.

Periodos suportados:

- `today`
- `last7days`
- `currentMonth`
- `previousMonth`
- `custom`

Para `custom`, `dateFrom` e `dateTo` sao obrigatorios e `dateFrom` deve ser menor ou igual a `dateTo`.

As metricas e listas do dashboard devem sempre usar `company.id` da empresa autenticada.

## Decisao 015 — Configuracoes da Empresa / Perfil Comercial v1

A primeira versao de Configuracoes da Empresa usa a entidade existente `CompanyEntity` e a tabela `companies`.

Nao ha segunda entidade de empresa, filial ou perfil comercial paralelo nesta versao.

Os endpoints internos sao:

- `GET /company/settings`
- `PUT /company/settings`

Eles exigem autenticacao e sempre usam a empresa do token JWT via contexto multi-tenant.

Os dados comerciais configurados sao usados em:

- PDF de proposta/orcamento.
- Proposta publica.
- Padroes de novos orcamentos.

Novos orcamentos usam validade, observacoes e condicoes de pagamento padrao somente quando o payload nao informa valores especificos.

Upload de logo, storage, templates customizaveis, dados fiscais avancados e multiplos perfis comerciais ficam para evolucoes futuras.
