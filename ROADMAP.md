# ROADMAP.md — StockFlow

## Objetivo

Organizar o desenvolvimento do StockFlow em fases pequenas para facilitar implementação com Codex, revisão técnica e deploy progressivo.

---

## Regra obrigatória de testes por fase

Toda fase implementada deve incluir testes automatizados proporcionais ao escopo entregue.

- Backend Quarkus deve usar JUnit 5, RestAssured e testes de service quando houver regra de negócio relevante.
- Frontend Next.js deve usar Vitest, React Testing Library e testes básicos de componentes/hooks quando houver UI ou lógica frontend nova.
- Cada módulo novo precisa vir com testes mínimos para o fluxo principal, validações e erros relevantes.
- Antes de concluir uma fase, os testes do backend e do frontend devem ser executados.
- Falhas de teste devem ser corrigidas antes da fase ser considerada concluída.
- Fases sem implementação de código devem registrar explicitamente que não há testes automatizados aplicáveis e manter a estratégia de testes documentada.

---

## Regra anti-loop para uso com Codex

Ao implementar ou corrigir uma fase:

1. Não repetir a mesma solução mais de uma vez.
2. Se o mesmo erro aparecer duas vezes, parar e explicar a causa provável.
3. Não recriar arquivos inteiros sem necessidade.
4. Fazer alterações pequenas e rastreáveis.
5. Rodar testes após cada correção relevante.
6. Se não conseguir corrigir após 3 tentativas, interromper e entregar relatório do problema.

## Fase 0 — Planejamento e base documental

### Objetivo

Criar documentação e arquivos-base do projeto.

### Entregas

- `README.md`
- `ARCHITECTURE.md`
- `SPEC.md`
- `ROADMAP.md`
- `.env.example`
- `docker-compose.yml`

### Critério de conclusão

- Codex consegue entender o produto, stack, módulos, entidades, regras e fases de implementação lendo os arquivos.
- Estratégia obrigatória de testes documentada em `README.md`, `ARCHITECTURE.md`, `SPEC.md` e `ROADMAP.md`.
- Como não há código funcional nesta fase, não há testes automatizados aplicáveis.

---

## Fase 1 — Setup técnico do projeto

### Objetivo

Criar a estrutura inicial do backend, frontend e banco.

### Backend

- Criar projeto Quarkus.
- Configurar Java 21.
- Configurar PostgreSQL.
- Configurar Flyway.
- Configurar OpenAPI.
- Configurar health checks.
- Criar estrutura de pacotes.

### Frontend

- Criar projeto Next.js com TypeScript.
- Configurar Tailwind.
- Criar layout base.
- Configurar cliente HTTP.
- Configurar variáveis de ambiente.

### Infra

- Ajustar Dockerfiles.
- Validar `docker-compose.yml`.
- Subir frontend, backend e banco.

### Critério de conclusão

- `docker compose up -d --build` sobe todos os serviços.
- Backend responde health check.
- Frontend abre no navegador.
- Swagger UI disponível.
- Backend possui configuração inicial para testes com JUnit 5 e RestAssured.
- Frontend possui configuração inicial para testes com Vitest e React Testing Library.
- Testes mínimos de smoke/build são executados antes de concluir a fase.

---

## Fase 2 — Autenticação e empresas

### Objetivo

Criar a base SaaS multi-tenant.

### Entregas

- Cadastro de empresa.
- Cadastro de usuário OWNER.
- Login.
- JWT.
- Endpoint `/auth/me`.
- Middleware/filtro de autenticação.
- Contexto de empresa autenticada.
- Tela de login.
- Tela de cadastro.
- Rotas protegidas no frontend.

### Critério de conclusão

- Usuário cria conta e empresa.
- Usuário faz login.
- Usuário acessa dashboard protegido.
- Backend identifica `user_id` e `company_id` via token.
- Backend possui testes com JUnit 5 e RestAssured para `POST /auth/register`, `POST /auth/login`, `GET /auth/me` e bloqueio de rota privada sem token.
- Backend possui testes de service quando houver regra de autenticação, hash de senha, emissão/validação de JWT ou contexto multi-tenant fora do Resource.
- Frontend possui testes com Vitest e React Testing Library para tela de login, tela de cadastro e proteção/redirecionamento de rota.
- Testes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Fase 3 — Clientes

### Objetivo

Permitir cadastro e gestão básica de clientes.

### Entregas

- Migration de clientes.
- CRUD de clientes no backend.
- Listagem com busca e paginação.
- Tela de clientes.
- Formulário de novo cliente.
- Formulário de edição.
- Validações básicas.

### Critério de conclusão

- Usuário consegue criar, listar, editar e excluir/inativar clientes.
- Dados são filtrados por empresa.
- Backend possui testes com JUnit 5 e RestAssured para CRUD de clientes, validações obrigatórias e acesso negado a clientes de outra empresa.
- Backend possui testes de service/repository quando houver regra de busca, paginação, inativação ou isolamento por `company_id`.
- Frontend possui testes com Vitest e React Testing Library para listagem, formulário de criação/edição e estados básicos de erro/carregamento.
- Testes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Fase 4 — Produtos e serviços

### Objetivo

Criar a base de itens usados nos orçamentos.

### Entregas

- CRUD de produtos.
- CRUD de serviços.
- Campo de estoque atual.
- Campo de estoque mínimo.
- Campo de preço de custo.
- Campo de preço de venda.
- Busca por nome/SKU.
- Tela de produtos.
- Tela de serviços.

### Critério de conclusão

- Usuário consegue cadastrar produtos e serviços.
- Produto pode ser usado depois em orçamento e estoque.
- Serviço pode ser usado em orçamento sem estoque.
- Backend possui testes com JUnit 5 e RestAssured para CRUD de produtos e serviços, validações de preço, ativação/inativação e busca por nome/SKU.
- Backend possui testes de service quando houver regra de estoque mínimo, preço ou isolamento por `company_id`.
- Frontend possui testes com Vitest e React Testing Library para telas e formulários de produtos e serviços.
- Testes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Fase 5 — Estoque simples

### Objetivo

Controlar entradas, saídas, ajustes e alertas.

### Entregas

- Migration de movimentações.
- Entrada de estoque.
- Saída de estoque.
- Ajuste de estoque.
- Histórico de movimentações.
- Tela de estoque.
- Tela de produtos abaixo do mínimo.
- Validação contra estoque negativo.

### Critério de conclusão

- Toda alteração de estoque gera histórico.
- Produtos abaixo do mínimo aparecem na tela de reposição.
- Estoque atual é atualizado corretamente.
- Backend possui testes com JUnit 5 e RestAssured para entrada, saída, ajuste, histórico, estoque baixo e bloqueio de estoque negativo.
- Backend possui testes de service para cálculo de quantidade anterior/nova, geração de movimentação e isolamento por `company_id`.
- Frontend possui testes com Vitest e React Testing Library para tela de estoque, tela de baixo estoque e ações principais de movimentação.
- Testes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Fase 6 — Orçamentos

### Objetivo

Permitir criação e gestão de orçamentos.

### Entregas

- Migration de orçamentos.
- Migration de itens do orçamento.
- CRUD de orçamento.
- Adicionar produtos e serviços.
- Cálculo de subtotal, desconto, frete e total.
- Status do orçamento.
- Tela de listagem.
- Tela de criação.
- Tela de detalhes.

### Critério de conclusão

- Usuário cria orçamento com cliente e itens.
- Backend calcula os totais.
- Orçamento pode mudar de status.
- Orçamentos são filtrados por empresa.
- Backend possui testes com JUnit 5 e RestAssured para CRUD de orçamento, itens, cálculo de subtotal/desconto/frete/total e alterações de status.
- Backend possui testes de service para regras de cálculo, validação de itens e isolamento por `company_id`.
- Frontend possui testes com Vitest e React Testing Library para listagem, criação, detalhes e cálculo preliminar exibido.
- Testes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Fase 7 — Proposta pública e PDF

### Objetivo

Transformar orçamento em proposta compartilhável.

### Entregas

- Geração de token público.
- Página pública da proposta.
- Botão de aprovação.
- Botão de recusa.
- Geração de PDF.
- Aprovação com baixa automática de estoque.
- Proteção contra aprovação duplicada.

### Critério de conclusão

- Usuário gera link público.
- Cliente acessa sem login.
- Cliente aprova proposta.
- Orçamento muda para aprovado.
- Estoque é baixado uma única vez.
- PDF pode ser baixado.
- Backend possui testes com JUnit 5 e RestAssured para geração de token público, visualização sem login, aprovação, recusa, expiração e download de PDF.
- Backend possui testes de service para aprovação idempotente e baixa automática de estoque sem duplicidade.
- Frontend possui testes com Vitest e React Testing Library para página pública, botões de aprovação/recusa e estados de link expirado/erro.
- Testes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Fase 8 — Reposição / Compras

### Objetivo

Ajudar o usuário a saber o que precisa comprar/repor.

### Entregas

- Tela de reposição.
- Lista de produtos abaixo do estoque mínimo.
- Sugestão simples de compra.
- Ação rápida para registrar entrada.
- Histórico vinculado à reposição.

### Critério de conclusão

- Usuário visualiza produtos críticos.
- Usuário registra reposição com poucos cliques.
- Estoque é atualizado corretamente.
- Backend possui testes com JUnit 5 e RestAssured para listagem de reposição, sugestão de compra e registro de entrada.
- Backend possui testes de service para regra de produto crítico e atualização de estoque.
- Frontend possui testes com Vitest e React Testing Library para tela de reposição e ação rápida de entrada.
- Testes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Fase 9 — Dashboard

### Objetivo

Dar visão gerencial básica.

### Entregas

- Total de orçamentos do mês.
- Valor aprovado no mês.
- Valor em aberto.
- Taxa de aprovação.
- Produtos com estoque baixo.
- Últimos orçamentos.
- Últimos clientes.
- Cards e tabelas no frontend.

### Critério de conclusão

- Dashboard carrega indicadores da empresa autenticada.
- Dados batem com orçamentos, clientes e estoque.
- Backend possui testes com JUnit 5 e RestAssured para `GET /dashboard/summary`, filtros por empresa e cálculo dos indicadores.
- Backend possui testes de service para agregações de dashboard quando houver lógica fora do Resource.
- Frontend possui testes com Vitest e React Testing Library para cards, tabelas, estados de carregamento e erro parcial.
- Testes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Fase 10 — Deploy em VPS

### Objetivo

Colocar o MVP online para demonstração e venda.

### Entregas

- Configuração de produção.
- Nginx ou Traefik.
- HTTPS.
- Banco PostgreSQL persistente.
- Volumes Docker.
- Script de backup.
- Documentação de deploy.
- Domínio apontado.

### Critério de conclusão

- Sistema acessível em domínio real.
- API acessível com HTTPS.
- Banco com volume persistente.
- Backup funcionando.
- Testes automatizados existentes do backend e do frontend continuam passando antes do deploy.
- Health checks de backend e frontend são validados em ambiente de produção ou staging.
- Script/configuração de backup possui validação mínima documentada ou automatizada quando possível.

---

## Fase 11 — Ajustes comerciais

### Objetivo

Preparar venda para primeiros clientes.

### Entregas

- Landing page simples.
- Página de preço fundador.
- Ambiente demo.
- Roteiro de abordagem.
- Formulário de interesse.
- Botão WhatsApp.

### Critério de conclusão

- Produto pode ser apresentado para potenciais clientes.
- Fluxo principal está demonstrável.
- Primeiros clientes podem testar.
- Frontend possui testes com Vitest e React Testing Library para landing page, página de preço fundador e formulário de interesse quando implementados.
- Integrações de formulário/WhatsApp possuem testes ou validação documentada quando não forem automatizáveis.
- Testes automatizados existentes do backend e do frontend são executados e passam antes de concluir a fase.

---

## Ordem recomendada para pedir ao Codex

1. Implementar Fase 1.
2. Corrigir build e Docker.
3. Implementar Fase 2.
4. Testar autenticação.
5. Implementar Fase 3.
6. Implementar Fase 4.
7. Implementar Fase 5.
8. Implementar Fase 6.
9. Implementar Fase 7.
10. Implementar Fase 8.
11. Implementar Fase 9.
12. Preparar Fase 10.

---

## Regra de ouro

Não avançar para a próxima fase se a fase atual não estiver rodando com Docker Compose.
Também não avançar se os testes obrigatórios da fase atual não tiverem sido criados, executados e aprovados.
