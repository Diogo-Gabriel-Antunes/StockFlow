# SPEC.md — StockFlow

## Visao do produto

StockFlow e um SaaS de gestao comercial para pequenos negocios que precisam controlar clientes, produtos, servicos, estoque, orcamentos e propostas sem depender de planilhas e documentos manuais.

O foco do produto e organizar o fluxo:

```txt
Cliente -> Produtos/Servicos -> Orcamento -> Proposta -> Aprovacao -> Conclusao -> Estoque
```

## Publico-alvo

- Pequenos fornecedores.
- Pequenos distribuidores.
- Negocios que vendem por orcamento.
- Empresas com catalogo simples de produtos e servicos.
- Operacoes que precisam controlar estoque minimo e reposicao sem ERP complexo.

## Modulos atuais

### Implementados

- Autenticacao.
- Empresas e multi-tenant.
- Clientes.
- Produtos.
- Servicos.
- Estoque e movimentacoes.
- Estoque baixo.
- Orcamentos.
- Link publico de proposta.
- Portal do Cliente v1.
- Proposta Publica v2.
- Central de Notificacoes v1.
- Historico de Atividades v1.
- PDF profissional inicial de proposta/orcamento.
- Reposicao / Compras v1.
- Dashboard Gerencial v2.
- Configuracoes da Empresa / Perfil Comercial v1.
- Toast profissional.
- Modal de confirmacao profissional.

### Parciais

- Ordenacao interativa em cabecalhos de tabela ainda nao foi implementada.
- Deploy VPS: arquivos existem; falta validacao em ambiente real.

## Regras de multi-tenant

Todo dado operacional interno pertence a uma empresa.

Regra obrigatoria:

```txt
Usuario autenticado so pode acessar dados da propria empresa.
```

Aplicar em:

- Clientes.
- Produtos.
- Servicos.
- Estoque.
- Movimentacoes.
- Orcamentos.
- Dashboard.
- Reposicao.
- Configuracoes da empresa.
- Notificacoes.
- Historico de atividades.

Endpoints publicos de proposta usam token publico e nao exigem login, mas devem acessar somente a proposta vinculada ao token.

Endpoints publicos do portal do cliente usam token publico do cliente e nao exigem login, mas devem acessar somente dados do cliente vinculado ao token.

Notificacoes e atividades sao internas, exigem autenticacao e devem retornar apenas registros da empresa autenticada.

## Autenticacao

### Funcionalidades

- Cadastro de empresa e usuario OWNER.
- Login.
- JWT.
- `GET /auth/me`.
- Rotas protegidas no frontend.
- Filtro de autenticacao no backend.

### Regras

- Login valido retorna token.
- Credenciais invalidas retornam erro de autenticacao.
- Endpoints internos exigem token.
- Token carrega `user_id` e `company_id` usados pelo contexto autenticado.

## Clientes

### Campos principais

- Nome.
- Tipo.
- Documento.
- E-mail.
- Telefone.
- WhatsApp.
- Cidade.
- Estado.
- Observacoes.
- Ativo/inativo.

### Regras

- Cliente pertence a empresa autenticada.
- Listagem deve retornar apenas clientes da empresa atual.
- Busca backend considera dados principais de contato.
- Exclusao atual funciona como inativacao/cancelamento logico conforme padrao do modulo.

### Pendencias

- Controles visuais de paginacao.
- Filtros e ordenacao mais completos.

## Produtos

### Campos principais

- Nome.
- Descricao.
- SKU/codigo interno.
- Codigo de barras opcional (`barcode`).
- Codigo de referencia opcional (`referenceCode`).
- URL de imagem opcional (`imageUrl`).
- Categoria.
- Preco de custo.
- Preco de venda.
- Unidade.
- Estoque atual.
- Estoque minimo.
- Ativo/inativo.

### Regras

- Produto pertence a empresa autenticada.
- Produto controla estoque.
- Produto pode ser usado em orcamento.
- Produto pode aparecer em estoque baixo quando `stockQuantity <= minimumStock`.
- Codigo de barras e codigo de referencia nao sao obrigatorios.
- Busca de produtos deve considerar nome, SKU, codigo de barras e codigo de referencia.
- `imageUrl` e opcional, aceita no maximo 500 caracteres e deve iniciar com `http://` ou `https://` quando informado.
- Produto novo fica ativo por padrao, salvo payload interno explicito.
- Produto inativo continua acessivel no painel interno por filtros, mas nao aparece em catalogo publico ou autocomplete do portal.

## Servicos

### Campos principais

- Nome.
- Descricao.
- Preco padrao.
- Custo estimado.
- Ativo/inativo.

### Regras criticas

- Servicos nao controlam estoque.
- Servicos podem entrar em orcamentos.
- Servicos nao geram movimentacao de estoque.
- Servicos nao baixam estoque na conclusao do orcamento.

## Estoque

### Regras principais

- Estoque nao pode ficar negativo.
- Toda entrada gera movimentacao.
- Toda saida gera movimentacao.
- Todo ajuste gera movimentacao.
- Movimentacoes devem respeitar empresa autenticada.
- Produtos inativos nao devem aparecer em alertas de estoque baixo, salvo regra futura explicita.

### Endpoints principais

- `GET /stock/movements`
- `GET /stock/movements/product/{productId}`
- `GET /stock/low`
- `POST /stock/entries`
- `POST /stock/outputs`
- `POST /stock/adjustments`

### Status de estoque baixo

- `OUT_OF_STOCK`: estoque menor ou igual a zero.
- `LOW_STOCK`: estoque maior que zero e menor ou igual ao estoque minimo.

## Movimentacoes de estoque

### Dados registrados

- Empresa.
- Produto.
- Tipo.
- Quantidade.
- Quantidade anterior.
- Nova quantidade.
- Motivo.
- Tipo de referencia.
- ID de referencia.
- Usuario responsavel.
- Data/hora.

### Tipos atuais

- `IN`
- `OUT`
- `ADJUSTMENT`
- `SALE`
- `CANCELLATION`

### Regras

- Movimentacoes de orcamento concluido usam referencia ao orcamento.
- Servicos nao geram movimentacao.
- Movimentacoes de reposicao usam referencia `REPLENISHMENT`.

## Orcamentos

## Fluxo de status

O fluxo correto separa aprovacao do cliente e conclusao interna.

```txt
DRAFT -> SENT -> CUSTOMER_APPROVED -> COMPLETED
```

Labels em portugues:

```txt
Rascunho -> Enviado -> Aprovado pelo cliente -> Concluido
```

Tambem existem:

- `REJECTED`: recusado.
- `CANCELLED`: cancelado.
- `EXPIRED`: expirado.

### Regras criticas

- Orcamento nasce como `DRAFT`.
- Novo orcamento usa `defaultQuoteValidityDays`, `defaultQuoteNotes` e `defaultPaymentTerms` da empresa quando esses campos estiverem configurados e o payload nao trouxer valores especificos.
- Valores informados diretamente no orcamento sempre tem prioridade sobre os padroes da empresa.
- Envio muda para `SENT`.
- Aprovacao publica muda para `CUSTOMER_APPROVED`.
- Aprovacao manual interna como cliente tambem muda para `CUSTOMER_APPROVED`.
- Aprovacao publica nao baixa estoque.
- Aprovacao manual como cliente nao baixa estoque.
- Baixa de estoque acontece somente em `POST /quotes/{id}/complete`.
- Conclusao interna so pode ocorrer em `CUSTOMER_APPROVED`.
- Conclusao interna valida estoque suficiente antes de baixar qualquer item.
- Produtos repetidos no orcamento devem ter quantidades somadas antes da validacao.
- Servicos sao ignorados na baixa.
- Produtos baixam estoque na conclusao interna.
- Conclusao cria movimentacoes de estoque.
- Conclusao e transacional.
- O mesmo orcamento nao pode baixar estoque duas vezes.
- A protecao atual usa `stockDeducted`.

### Endpoints internos principais

- `GET /quotes`
- `POST /quotes`
- `GET /quotes/{id}`
- `PUT /quotes/{id}`
- `DELETE /quotes/{id}`
- `POST /quotes/{id}/send`
- `POST /quotes/{id}/mark-customer-approved`
- `POST /quotes/{id}/complete`
- `POST /quotes/{id}/reject`
- `POST /quotes/{id}/cancel`
- `POST /quotes/{id}/public-token`
- `GET /quotes/{id}/pdf`

`POST /quotes/{id}/approve` ainda existe como compatibilidade/alias interno para marcar aprovacao do cliente, mas novas telas devem preferir `mark-customer-approved`.

## Proposta publica

### Endpoints

- `GET /public/quotes/{token}`
- `POST /public/quotes/{token}/approve`
- `POST /public/quotes/{token}/reject`
- `GET /public/quotes/{token}/pdf`

### Regras

- Acesso publico usa token.
- Token invalido retorna erro conforme padrao atual.
- A proposta publica exibe dados comerciais configurados da empresa, quando disponiveis.
- Campos comerciais vazios nao devem gerar linhas ou textos vazios.
- A Proposta Publica v2 usa layout comercial responsivo, com cabecalho profissional, tabela de itens, totais destacados e botoes claros.
- Aprovar proposta exige confirmacao profissional.
- Recusar proposta exige confirmacao profissional e aceita motivo opcional.
- Link expirado marca orcamento como expirado.
- Aprovar publicamente nao baixa estoque.
- Recusar publicamente muda para `REJECTED`.
- Recusa publica pode registrar `rejectionReason` e `customerDecisionAt`.
- Status final nao deve permitir nova aprovacao/recusa.

## Portal do Cliente

### Endpoints publicos

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

### Endpoints internos

- `GET /quote-requests`
- `GET /quote-requests/{id}`
- `PUT /quote-requests/{id}/status`
- `POST /quote-requests/{id}/convert-to-quote`

### Token do cliente

- Cada cliente possui `portalToken`.
- Token e unico, publico, dificil de adivinhar e nao sequencial.
- Token e gerado automaticamente ao criar cliente.
- Clientes antigos recebem token sob demanda quando listados/detalhados internamente.
- Token invalido retorna recurso nao encontrado.
- Payload publico nunca aceita `companyId` ou `customerId`.

### Regras de propostas no portal

- Cliente ve apenas propostas do proprio cliente.
- Cliente nao ve rascunhos internos (`DRAFT`).
- Propostas em aberto usam `SENT` e `CUSTOMER_APPROVED`.
- Historico usa `COMPLETED`, `REJECTED`, `CANCELLED` e `EXPIRED`.
- Cliente so aprova proposta `SENT`.
- Cliente so recusa proposta `SENT`.
- Aprovacao vira `CUSTOMER_APPROVED` e nao baixa estoque.
- Recusa vira `REJECTED`, pode salvar motivo e nao baixa estoque.
- PDF pelo portal reutiliza o servico de PDF existente.

### Solicitacoes de orcamento

Status:

- `REQUESTED`: solicitada.
- `IN_REVIEW`: em analise.
- `CONVERTED_TO_QUOTE`: convertida em orcamento.
- `CANCELLED`: cancelada.

Regras:

- Cliente cria solicitacao com titulo e ao menos um item.
- Item exige quantidade maior que zero.
- Cada item deve ter `productId` de produto ativo da empresa do token ou descricao manual.
- Se `productId` for informado, o produto deve existir, estar ativo e pertencer a empresa do cliente; produto inexistente, inativo ou de outra empresa retorna recurso nao encontrado.
- Se `productId` for informado, a solicitacao salva snapshot de nome, SKU, referencia e imagem do produto.
- Se `productId` nao for informado, descricao manual e obrigatoria.
- Cliente edita ou cancela apenas em `REQUESTED`.
- Empresa lista solicitacoes da propria empresa.
- Empresa pode marcar `IN_REVIEW`.
- Empresa pode cancelar solicitacoes ainda nao convertidas.
- Empresa pode converter `REQUESTED` ou `IN_REVIEW` em orcamento oficial.
- Conversao cria orcamento `DRAFT` vinculado ao cliente.
- Conversao nao cria itens oficiais com preco e nao altera estoque.
- Itens da solicitacao entram nas observacoes do orcamento rascunho para analise interna, incluindo produto selecionado, SKU, referencia, quantidade e observacao quando houver.

### Catalogo publico de produtos

Endpoints:

- `GET /public/customer-portal/{token}/products`
- `GET /public/customer-portal/{token}/products/search`
- `GET /public/customer-portal/{token}/products/{productId}`

Regras:

- Endpoints nao exigem login, mas exigem token publico valido de cliente.
- O token define o cliente e a empresa.
- Retornam apenas produtos ativos da empresa do cliente.
- Nao retornam preco de custo, estoque atual, estoque minimo ou movimentacoes.
- A listagem aceita `page`, `size` e `search`.
- O autocomplete aceita `query`, retorna lista vazia para menos de 3 caracteres e limita resultados.
- A busca considera nome, SKU, categoria, codigo de barras e codigo de referencia conforme busca atual de produtos.

## Central de Notificacoes e Historico de Atividades

### Endpoints internos

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications/{id}/read`
- `POST /notifications/read-all`
- `GET /activity-logs`

### Notificacoes

Notificacoes sao por empresa nesta v1.

Campos principais:

- Empresa.
- Tipo.
- Titulo.
- Mensagem.
- Tipo e ID da entidade de origem.
- Link interno sugerido.
- Data de leitura.
- Data de criacao.

Tipos implementados:

- `QUOTE_APPROVED`
- `QUOTE_REJECTED`
- `QUOTE_COMPLETED`
- `QUOTE_REQUEST_CREATED`
- `QUOTE_REQUEST_CANCELLED`
- `QUOTE_REQUEST_CONVERTED`
- `STOCK_LOW`
- `STOCK_OUT`
- `RESTOCK_REGISTERED`

Regras:

- Usuario autenticado ve apenas notificacoes da propria empresa.
- Marcar uma notificacao como lida exige que ela pertenca a empresa autenticada.
- Marcar todas como lidas afeta somente a empresa autenticada.
- O contador de nao lidas considera apenas `readAt` vazio da empresa atual.
- A v1 nao possui notificacoes por usuario individual.
- A v1 nao usa WebSocket, e-mail, WhatsApp ou push.

### Historico de atividades

Atividades registram eventos operacionais relevantes.

Campos principais:

- Empresa.
- Tipo de ator: `INTERNAL_USER`, `CUSTOMER` ou `SYSTEM`.
- Usuario interno, quando aplicavel.
- Cliente, quando aplicavel.
- Acao.
- Tipo e ID da entidade.
- Descricao amigavel.
- Metadata textual opcional.
- Data de criacao.

Regras:

- Usuario autenticado ve apenas atividades da propria empresa.
- Eventos publicos por token registram atividades na empresa do cliente/proposta do token.
- Atividades nao substituem auditoria avancada com diff campo a campo.

### Eventos que geram notificacao e atividade

- Cliente aprova proposta publica ou pelo portal: `QUOTE_APPROVED`.
- Cliente recusa proposta publica ou pelo portal: `QUOTE_REJECTED`.
- Cliente cria solicitacao de orcamento: `QUOTE_REQUEST_CREATED`.
- Cliente cancela solicitacao de orcamento: `QUOTE_REQUEST_CANCELLED`.
- Empresa converte solicitacao em orcamento: `QUOTE_REQUEST_CONVERTED`.
- Empresa conclui orcamento: `QUOTE_COMPLETED`.
- Produto cruza para estoque baixo: `STOCK_LOW`.
- Produto cruza para estoque zero: `STOCK_OUT`.
- Empresa registra reposicao: `RESTOCK_REGISTERED`.

Eventos de estoque baixo e sem estoque devem evitar spam: a notificacao so e criada quando a movimentacao cruza o limite. Se o produto ja estava baixo ou zerado, novas movimentacoes nesse mesmo estado nao criam notificacoes repetidas.

### Frontend

- Sino de notificacoes no layout interno autenticado.
- Contador de nao lidas.
- Dropdown com notificacoes recentes nao lidas.
- Link para `/notifications`.
- Pagina `/notifications` com filtros de status/tipo, paginacao e acoes de leitura.
- Pagina `/activity-logs` com historico paginado e filtro simples por entidade.

Toda UI da central deve seguir o modo dark fixo do frontend.

## PDF de proposta/orcamento

### Funcionalidades

- O sistema gera PDF da proposta/orcamento sob demanda no backend.
- O PDF interno e acessado por usuario autenticado em `GET /quotes/{id}/pdf`.
- O PDF publico e acessado sem login por token valido em `GET /public/quotes/{token}/pdf`.
- O frontend acessa os PDFs via `/api/quotes/{id}/pdf` e `/api/public/quotes/{token}/pdf`.
- A tela interna de detalhe do orcamento possui botao para baixar/visualizar PDF.
- A pagina publica da proposta possui botao para baixar/visualizar PDF.

### Conteudo do PDF

- Dados da empresa.
- Dados comerciais configurados da empresa, incluindo nome comercial, razao social, documento, e-mail, telefone, WhatsApp e endereco quando disponiveis.
- Dados do cliente.
- Dados do orcamento, incluindo codigo, data, validade quando houver e status.
- Produtos e servicos na mesma tabela.
- Quantidade, valor unitario, desconto por item e total por item.
- Subtotal, desconto, frete e total final.
- Rodape indicando que a proposta foi gerada pelo StockFlow.

### Regras

- O PDF e gerado sob demanda em memoria.
- O PDF nao e salvo em MinIO, S3 ou storage nesta fase.
- O endpoint interno exige autenticacao e respeita empresa/multi-tenant.
- O endpoint publico exige token publico valido e nao aceita acesso por `quoteId` sem token.
- A geracao de PDF nao altera status do orcamento e nao baixa estoque.
- O nome principal da empresa no PDF usa `tradeName`; se estiver vazio, usa o nome original da empresa.
- Observacoes e condicoes de pagamento usam os valores do orcamento; se estiverem vazios, usam os padroes comerciais da empresa.

## Configuracoes da Empresa / Perfil Comercial

### Endpoints

- `GET /company/settings`
- `PUT /company/settings`

### Campos

- `tradeName`: nome comercial usado em propostas e PDF.
- `legalName`: razao social.
- `document`: CPF/CNPJ ou documento comercial.
- `email`: e-mail comercial.
- `phone`: telefone comercial.
- `whatsapp`: WhatsApp comercial.
- `address`, `addressNumber`, `addressComplement`, `neighborhood`, `city`, `state`, `zipCode`: endereco comercial.
- `defaultQuoteNotes`: observacoes padrao para novas propostas.
- `defaultPaymentTerms`: condicoes de pagamento padrao.
- `defaultQuoteValidityDays`: validade padrao de novos orcamentos.

### Regras

- Endpoints exigem autenticacao.
- Usuario autenticado ve e edita somente a empresa do proprio token.
- O payload nao aceita troca de empresa.
- Os dados comerciais ficam na empresa existente; nao ha segunda entidade de empresa nesta versao.
- `tradeName` e obrigatorio na atualizacao.
- `email`, quando informado, deve ter formato valido.
- `state` aceita no maximo 2 caracteres.
- `defaultQuoteValidityDays` deve ficar entre 1 e 365 quando informado.
- Novos orcamentos aplicam validade, observacoes e condicoes padrao somente quando o payload nao trouxer valores especificos.
- PDF e proposta publica exibem somente campos comerciais preenchidos.

### Fora do escopo atual

- Upload de logo.
- Storage MinIO/S3.
- Templates customizaveis de PDF.
- Personalizacao visual avancada da proposta.
- Dados fiscais avancados.

## Reposicao / Compras

### Funcionalidades

- Listagem de produtos que precisam de reposicao em `GET /stock/replenishment`.
- Registro rapido de reposicao em `POST /stock/replenishment/{productId}/restock`.
- Tela interna em `/stock/replenishment`.
- Modal para informar quantidade e motivo.
- Feedback por toast.

### Regras

- Endpoints exigem autenticacao.
- Listagem e reposicao respeitam empresa/multi-tenant.
- Apenas produtos ativos aparecem na reposicao.
- Produto entra na lista quando `stockQuantity <= minimumStock`.
- Se `stockQuantity < minimumStock`, `suggestedQuantity = minimumStock - stockQuantity`.
- Se `stockQuantity == minimumStock`, `suggestedQuantity = 1`.
- Produto zerado retorna status `OUT_OF_STOCK`.
- Produto com estoque maior que zero e menor ou igual ao minimo retorna status `LOW_STOCK`.
- Registro de reposicao soma a quantidade informada ao estoque atual.
- Quantidade deve ser maior que zero.
- Reposicao cria movimentacao `IN`.
- Movimentacao de reposicao usa `referenceType=REPLENISHMENT`.
- Produto de outra empresa nao aparece e nao pode ser reposto.

### Fora do escopo atual

- Pedido de compra completo.
- Fornecedores.
- Status de pedido de compra.
- Recebimento parcial.
- Sugestao baseada em vendas historicas.

## Dashboard

### Dashboard Gerencial v2

Endpoint autenticado:

- `GET /dashboard/summary`

Parametros:

- `period`: `today`, `last7days`, `currentMonth`, `previousMonth` ou `custom`.
- `dateFrom`: obrigatorio quando `period=custom`.
- `dateTo`: obrigatorio quando `period=custom`.

Se `period` nao for informado, o padrao e `currentMonth`.

### Indicadores atuais

- Orcamentos criados no periodo.
- Orcamentos aprovados pelo cliente.
- Orcamentos concluidos.
- Orcamentos recusados.
- Orcamentos cancelados.
- Orcamentos em aberto.
- Valor aprovado/concluido no periodo.
- Valor em aberto no periodo.
- Taxa de aprovacao calculada por `completed / total * 100`.
- Produtos ativos com estoque baixo.
- Produtos ativos sem estoque.
- Total de clientes ativos.
- Clientes cadastrados no periodo.
- Ultimos orcamentos.
- Ultimos clientes.
- Ultimas movimentacoes de estoque.
- Produtos criticos.

### Regras

- Dashboard deve respeitar empresa autenticada.
- Indicadores devem refletir apenas dados da empresa atual.
- `custom` exige `dateFrom` e `dateTo`, com `dateFrom <= dateTo`; caso contrario retorna `400`.
- Produtos criticos usam a regra atual `stockQuantity <= minimumStock`.

## UX

### Regras obrigatorias

Nao usar:

```txt
window.alert
alert
window.confirm
confirm
```

Usar:

- Toast profissional para sucesso, erro, aviso e informacao.
- Modal profissional para confirmacoes destrutivas ou criticas.

### Estado atual

- Toast global com `sonner`.
- Helper `appToast`.
- Modal reutilizavel `ConfirmDialog`.
- Loading, empty e error states em varios modulos.
- Interface fixa em modo dark, sem opcao de alternancia para modo claro ou tema do sistema.
- Novas features devem nascer em dark mode e usar tokens de tema para fundos, textos e bordas, evitando `bg-white`, `bg-slate-50` e textos escuros como base visual de paginas.

## Paginacao, busca e filtros

### Implementado

- Backend aceita `page` e `size` nas listagens principais.
- `size` padrao e `10`; `size` maximo e `100`.
- Backend pagina no banco com Panache.
- Backend retorna DTOs paginados com `items`, `content`, `page`, `size`, `total`, `totalElements`, `totalPages`, `first` e `last`.
- Produtos aceitam `search`, `active`, `lowStock`, `sort` e `direction`.
- Clientes aceitam `search`, `sort` e `direction`.
- Servicos aceitam `search`, `active`, `sort` e `direction`.
- Orcamentos aceitam `search`, `status`, `customerId`, `dateFrom`, `dateTo`, `sort` e `direction`.
- Movimentacoes aceitam `search`, `productId`, `type`, `dateFrom`, `dateTo`, `sort` e `direction`.
- Reposicao aceita `search`, `status`, `page` e `size`.
- Frontend possui busca, filtros e controles de paginacao nas listagens principais.
- Frontend permite trocar itens por pagina entre `10`, `20`, `50` e `100`.

### Pendencias

- Ordenacao interativa por clique nos cabecalhos.
- Filtro por usuario nas movimentacoes.

## Criterios de aceite por modulo

### Autenticacao

- Cadastro/login funcionando.
- `/auth/me` retorna usuario e empresa.
- Endpoints internos bloqueiam ausencia de token.

### Clientes

- CRUD respeita empresa autenticada.
- Busca funciona.
- Testes cobrem fluxo principal.

### Produtos

- CRUD respeita empresa autenticada.
- Campos opcionais `barcode` e `referenceCode` existem.
- Busca considera codigos.
- Estoque atual/minimo existem.

### Servicos

- CRUD respeita empresa autenticada.
- Servico entra em orcamento sem estoque.

### Estoque

- Entrada, saida e ajuste atualizam estoque.
- Saida nao permite estoque negativo.
- Toda alteracao gera movimento.

### Orcamentos

- Totais sao calculados.
- Produto e servico podem ser adicionados.
- Aprovacao publica nao baixa estoque.
- Conclusao interna baixa estoque uma vez.

### Proposta publica

- Link publico funciona sem login.
- Aprovar/recusar atualiza status conforme regra.
- PDF de proposta pode ser baixado internamente e publicamente por token valido.

### Dashboard

- Indicadores carregam dados da empresa autenticada.
- Filtro de periodo funciona.
- Valores monetarios sao exibidos em BRL no frontend.
- Estoque critico, ultimos orcamentos, ultimos clientes e ultimas movimentacoes aparecem.

### UX

- Feedback usa toast.
- Confirmacoes usam modal.
- Nao usar alert/confirm nativo.
