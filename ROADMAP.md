# ROADMAP.md — StockFlow

## Objetivo

Organizar o desenvolvimento do StockFlow em fases pequenas para facilitar implementação com Codex, revisão técnica e deploy progressivo.

---

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
