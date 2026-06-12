# ROADMAP.md — StockFlow

## Objetivo

Organizar o desenvolvimento do StockFlow em fases pequenas, com status real do codigo atual, pendencias e proximas prioridades.

Status usados:

- `FEITO`: implementado no codigo com testes proporcionais.
- `PARCIAL`: implementado em parte ou funcional, mas com pendencias relevantes.
- `PENDENTE`: ainda nao implementado de forma significativa.

## Regra obrigatoria de testes por fase

Toda fase implementada deve incluir testes automatizados proporcionais ao escopo entregue.

- Backend Quarkus usa JUnit 5, RestAssured e testes de service quando houver regra de negocio relevante.
- Frontend Next.js usa Vitest e React Testing Library quando houver UI ou logica frontend nova.
- Cada modulo novo precisa cobrir fluxo principal, validacoes e erros relevantes.
- Antes de concluir uma fase, rodar testes/build possiveis.

## Regra anti-loop para uso com Codex

1. Nao repetir a mesma solucao mais de uma vez.
2. Se o mesmo erro aparecer duas vezes, parar e explicar a causa provavel.
3. Nao recriar arquivos inteiros sem necessidade.
4. Fazer alteracoes pequenas e rastreaveis.
5. Rodar testes apos cada correcao relevante.
6. Se nao conseguir corrigir apos 3 tentativas, interromper e entregar relatorio do problema.

## Fase 0 — Planejamento e base documental

Status: FEITO

### Ja implementado

- `README.md`
- `ARCHITECTURE.md`
- `SPEC.md`
- `ROADMAP.md`
- `.env.example`
- `.env.production.example`
- `docker-compose.yml`
- `PROJECT_CONTEXT.md` e `DECISIONS.md` passam a compor a documentacao base.

### Pendencias

- Manter estes arquivos atualizados a cada mudanca relevante de arquitetura ou regra de negocio.

## Fase 1 — Setup tecnico

Status: FEITO

### Ja implementado

- Backend Quarkus com Java 21.
- PostgreSQL.
- Flyway com migrations em `backend/src/main/resources/db/migration`.
- OpenAPI e Swagger UI em `/q/openapi` e `/q/swagger-ui`.
- Health checks.
- Frontend Next.js/React com TypeScript e Tailwind.
- Cliente HTTP centralizado no frontend.
- Dockerfiles para backend e frontend.
- Docker Compose local.
- Nginx como proxy reverso.

### Pendencias

- Automatizar validacao em CI, se o projeto passar a usar pipeline.

## Fase 2 — Autenticacao e empresas

Status: FEITO

### Ja implementado

- Cadastro de empresa e usuario OWNER.
- Login.
- JWT.
- Endpoint `GET /auth/me`.
- Filtro de autenticacao.
- Contexto de usuario e empresa autenticada.
- Tela de login.
- Tela de cadastro.
- Rotas protegidas no frontend.
- Endpoints internos protegidos.
- Testes backend para autenticacao.
- Testes frontend para protecao/rotas relacionadas.

### Pendencias

- Hardening futuro: refresh token, cookie httpOnly, politicas por perfil e expiracao mais refinada.

## Fase 3 — Clientes

Status: FEITO

### Ja implementado

- Migration de clientes.
- CRUD backend em `/customers`.
- Isolamento por empresa.
- Busca no backend.
- Paginacao backend com `page` e `size`.
- Busca visual na listagem.
- Controles visuais de paginacao no frontend.
- Seletor de itens por pagina.
- Tela de clientes.
- Formulario de criacao/edicao.
- Inativacao/cancelamento via acao de exclusao logica.
- Toasts e modal de confirmacao.
- Testes backend e frontend.

### Pendencias

- Ordenacao interativa em cabecalhos de tabela.
- Consolidar estados de erro/loading conforme padrao global.

## Fase 4 — Produtos e servicos

Status: FEITO

### Ja implementado

- CRUD de produtos em `/products`.
- CRUD de servicos em `/services`.
- Produtos com estoque atual, estoque minimo, preco de custo e preco de venda.
- Produtos com `barcode` e `referenceCode` opcionais.
- Servicos usados em orcamentos sem controle de estoque.
- Busca backend de produtos incluindo nome, SKU, codigo de barras e codigo de referencia.
- Paginacao backend.
- Busca visual nas listagens.
- Filtros de ativo/inativo em produtos e servicos.
- Filtro de estoque baixo em produtos.
- Controles visuais de paginacao no frontend.
- Seletor de itens por pagina.
- Isolamento por empresa.
- Telas de produtos e servicos.
- Formularios e validacoes.
- Testes backend e frontend.

### Pendencias

- Ordenacao interativa em tabelas.

## Fase 5 — Estoque simples

Status: FEITO

### Ja implementado

- Migration de movimentacoes de estoque.
- Entrada de estoque.
- Saida de estoque.
- Ajuste manual.
- Historico de movimentacoes.
- Historico com busca, filtros e paginacao visual.
- Endpoint `GET /stock/low`.
- Tela de movimentacoes em `/stock/movements`.
- Tela de estoque baixo em `/stock/low`.
- Validacao contra estoque negativo.
- Toda alteracao de estoque gera movimentacao.
- Movimentacoes respeitam empresa autenticada.
- Dashboard exibe produtos com estoque baixo.
- Testes backend e frontend.

### Pendencias de refinamento

- Filtro por usuario nas movimentacoes.
- Melhorias de usabilidade para operacoes grandes.

## Fase 6 — Orcamentos

Status: FEITO

### Ja implementado

- Migration de orcamentos e itens.
- CRUD backend em `/quotes`.
- Itens de produto e servico.
- Calculo de subtotal, desconto, frete e total.
- Status de orcamento.
- Tela de listagem.
- Listagem com busca, filtro por status, periodo e paginacao visual.
- Tela de criacao.
- Tela de detalhes.
- Isolamento por empresa.
- Fluxo de status separado entre aprovacao do cliente e conclusao interna.
- Endpoint `POST /quotes/{id}/complete`.
- Conclusao interna baixa estoque uma unica vez.
- Testes backend e frontend.

### Pendencias

- Regras futuras para reabertura ou edicao de orcamentos finalizados, se houver necessidade comercial.

## Fase 7 — Proposta publica e PDF

Status: FEITO

### Ja implementado

- Geracao de token/link publico.
- Pagina publica em `/public/quotes/{token}`.
- Aprovar proposta publicamente.
- Recusar proposta publicamente.
- Geracao de PDF de proposta/orcamento sob demanda pelo backend.
- Endpoint interno autenticado `GET /quotes/{id}/pdf`.
- Endpoint publico por token `GET /public/quotes/{token}/pdf`.
- Botao para baixar/visualizar PDF no detalhe interno do orcamento.
- Botao para baixar/visualizar PDF na proposta publica.
- Layout profissional inicial da proposta em PDF com empresa, cliente, itens, descontos e totais.
- Aprovacao publica muda para aprovado pelo cliente e nao baixa estoque.
- Baixa de estoque ocorre apenas na conclusao interna.
- Protecao contra baixa duplicada por `stockDeducted`.
- Testes backend e frontend.

### Pendencias de refinamento

- Melhorar layout visual do PDF.
- Upload/exibicao de logo da empresa no PDF.
- Storage de PDFs gerados, se houver necessidade futura.
- Envio de proposta por e-mail.
- Templates customizaveis de proposta.
- Melhorar apresentacao comercial da proposta publica.

## Fase 8 — Reposicao / Compras

Status: FEITO

### Ja implementado

- Endpoint `GET /stock/replenishment`.
- Endpoint `POST /stock/replenishment/{productId}/restock`.
- Endpoints internos exigem autenticacao e respeitam empresa/multi-tenant.
- Lista de produtos ativos no estoque minimo ou abaixo dele.
- Sugestao simples de reposicao.
- Acao rapida para registrar entrada de estoque.
- Historico vinculado por `referenceType=REPLENISHMENT`.
- Rotas legadas `/replenishments` e `/replenishments/entries` permanecem compatíveis.
- Tela frontend `/stock/replenishment`.
- Tela de reposicao com busca, filtro por status e paginacao visual.
- Item de menu `Reposicao / Compras`.
- Modal profissional para registrar reposicao.
- Toasts de sucesso, erro e validacao.
- Testes backend e frontend da feature.

### Pendencias futuras

- Fornecedores.
- Pedido de compra completo.
- Status de compra.
- Recebimento parcial.
- Sugestao baseada em consumo/vendas.
- Historico avancado de reposicao.

## Fase 9 — Dashboard

Status: FEITO

### Ja implementado

- Endpoint `GET /dashboard/summary`.
- Dashboard Gerencial v2.
- Filtros de periodo: hoje, ultimos 7 dias, mes atual, mes anterior e personalizado.
- Validacao de periodo personalizado no backend.
- Total de orcamentos do periodo.
- Valor concluido/aprovado operacionalmente no periodo.
- Valor em aberto no periodo.
- Taxa de aprovacao.
- Produtos com estoque baixo.
- Produtos sem estoque.
- Clientes cadastrados no periodo.
- Ultimos orcamentos.
- Ultimos clientes.
- Ultimas movimentacoes de estoque.
- Produtos criticos.
- Cards e tabelas no frontend.
- Testes backend e frontend.

### Pendencias de refinamento

- Drill-down dos indicadores.

## Fase 9.1 — Configuracoes da Empresa / Perfil Comercial

Status: FEITO

### Ja implementado

- Endpoint autenticado `GET /company/settings`.
- Endpoint autenticado `PUT /company/settings`.
- Campos comerciais da empresa na tabela `companies`.
- Tela frontend `/settings/company`.
- Item de menu para Configuracoes da Empresa.
- Dados comerciais: nome comercial, razao social, documento, e-mail, telefone, WhatsApp e endereco.
- Padroes de proposta: validade, observacoes e condicoes de pagamento.
- Validacoes backend e frontend.
- Toasts de sucesso e erro.
- Novos orcamentos usam padroes da empresa quando o payload nao informa valores especificos.
- PDF de proposta usa dados comerciais configurados.
- Proposta publica usa dados comerciais configurados.
- Testes backend e frontend.

### Pendencias futuras

- Upload de logo.
- Storage de logo.
- Templates customizaveis.
- Personalizacao visual da proposta publica.
- Dados fiscais avancados.

## Fase 9.2 — Portal do Cliente e Proposta Publica v2

Status: FEITO

### Ja implementado

- Token publico seguro vinculado ao cliente.
- Link do portal copiavel pela listagem de clientes.
- Portal publico `/customer-portal/{token}`.
- Catalogo publico de produtos ativos em `/customer-portal/{token}/products`.
- Autocomplete publico de produtos ativos na criacao/edicao de solicitacao.
- Endpoints publicos `/public/customer-portal/{token}`.
- Listagem de propostas em aberto e historico do cliente.
- Detalhe de proposta pelo portal.
- Aprovar proposta enviada pelo portal.
- Recusar proposta enviada pelo portal com motivo opcional.
- Download de PDF pelo portal.
- Proposta Publica v2 na rota publica existente.
- Confirmacao profissional para aprovacao.
- Modal de recusa com motivo opcional.
- Entidades `QuoteRequest` e `QuoteRequestItem`.
- Criacao de solicitacao de orcamento pelo cliente.
- Solicitacao de orcamento com produto cadastrado selecionado ou item manual.
- Snapshot de produto na solicitacao com nome, SKU, referencia e imagem.
- Edicao/cancelamento de solicitacao enquanto `REQUESTED`.
- Tela interna `/quote-requests`.
- Filtros por status e busca em solicitacoes.
- Marcar solicitacao como `IN_REVIEW`.
- Cancelar solicitacao internamente.
- Converter solicitacao em orcamento oficial `DRAFT`.
- Conversao sem alterar estoque.
- Conversao preserva os itens solicitados nas observacoes do orcamento rascunho para revisao interna.
- Testes backend e frontend.

### Pendencias futuras

- Login/senha do cliente.
- Magic link por e-mail.
- Notificacoes por e-mail.
- Notificacoes por WhatsApp.
- Upload real de imagem de produto.
- Storage MinIO/S3 para imagens.
- Galeria de imagens por produto.
- Categorias publicas de catalogo.
- Carrinho, pedido direto, checkout e pagamento online.
- Upload de arquivos na solicitacao.
- Chat com cliente.
- Assinatura digital.
- Conversao assistida com selecao de produtos/servicos e precificacao automatica.

## Fase 9.3 — Central de Notificacoes e Historico de Atividades

Status: FEITO

### Ja implementado

- Migration `V13__notifications_activity_logs.sql`.
- Entidade/tabela `notifications`.
- Entidade/tabela `activity_logs`.
- Services `NotificationService`, `ActivityLogService` e `BusinessEventService`.
- Endpoints autenticados:
  - `GET /notifications`
  - `GET /notifications/unread-count`
  - `POST /notifications/{id}/read`
  - `POST /notifications/read-all`
  - `GET /activity-logs`
- Notificacoes company-scoped, lidas para toda a empresa.
- Historico de atividades com atores `INTERNAL_USER`, `CUSTOMER` e `SYSTEM`.
- Eventos automaticos para aprovacao/recusa publica de proposta.
- Eventos automaticos para criacao, cancelamento e conversao de solicitacao.
- Evento automatico para conclusao de orcamento.
- Eventos automaticos para estoque baixo, produto sem estoque e reposicao registrada.
- Protecao anti-spam para estoque baixo/sem estoque baseada em cruzamento de limite.
- Sino de notificacoes no layout autenticado.
- Contador de nao lidas e dropdown de notificacoes recentes.
- Tela `/notifications` com filtros, paginacao, marcar como lida e marcar todas como lidas.
- Tela `/activity-logs` com historico paginado e filtro simples por entidade.
- Testes backend e frontend proporcionais.

### Pendencias futuras

- WebSocket ou Server-Sent Events.
- Notificacoes por e-mail.
- Notificacoes por WhatsApp.
- Preferencias por usuario.
- Leitura individual por usuario.
- Timeline no detalhe de cliente/orcamento.
- Auditoria avancada com diff campo a campo.

## Fase 10 — Deploy em VPS

Status: PARCIAL

### Ja implementado

- `docker-compose.prod.yml`.
- `.env.production.example`.
- `DEPLOY_ORACLE.md`.
- `infra/nginx/stockflow-ip.conf`.
- `infra/scripts/deploy.sh`.
- `infra/scripts/backup-db.sh`.
- Configuracao de producao por Docker Compose.
- Nginx expondo porta 80.
- Backend, frontend e Postgres em rede interna no compose de producao.
- Volume persistente para PostgreSQL.

### Pendencias

- Validar deploy em VPS real.
- Testar restore de backup.
- HTTPS fica para etapa futura com dominio.
- Documentar checklist operacional pos-deploy.

## Fase 11 — Ajustes comerciais

Status: PARCIAL

### Ja implementado

- Landing page simples em `/`.
- Secao de preco fundador.
- Planos comerciais na landing.
- CTA para demonstracao.
- Teste frontend da landing.

### Pendencias

- Ambiente demo dedicado.
- Formulario real de interesse.
- Botao WhatsApp.
- Roteiro de abordagem comercial.
- Captura e acompanhamento de leads.

## Acabamento tecnico e UX

Status geral: PARCIAL

### Ja implementado

- Toast profissional com `sonner`.
- Helper centralizado `appToast`.
- Modal reutilizavel `ConfirmDialog`.
- Interface fixa em modo dark, sem alternancia de tema.
- Busca por `alert`/`confirm` nativo removida de `frontend/src`.
- Loading, empty e error states em tabelas e telas principais.
- Testes frontend para componentes e paginas principais.

### Pendencias

- Ordenacao interativa em cabecalhos de tabela.
- Padrao global de resposta de erro no backend.
- Melhor cobertura de testes de service para regras criticas.

## Proxima prioridade recomendada

1. Padronizar envelope de erro da API.
2. Refinar ordenacao interativa.
3. Melhorar filtros analiticos futuros quando houver necessidade comercial.
4. Evoluir Reposicao / Compras para pedido de compra completo quando houver necessidade comercial.
