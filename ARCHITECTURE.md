# ARCHITECTURE.md — StockFlow

## 1. Visão arquitetural

StockFlow será um SaaS multi-tenant com frontend web, backend API, banco PostgreSQL e execução via Docker Compose em uma VPS.

Arquitetura inicial:

```txt
Usuário
  ↓
Frontend Next.js
  ↓
Backend Quarkus REST API
  ↓
PostgreSQL
```

Em produção:

```txt
Internet
  ↓
Nginx / Traefik
  ↓
Frontend Container
  ↓
Backend Container
  ↓
PostgreSQL Container ou Banco Gerenciado
```

---

## 2. Princípios arquiteturais

- Simplicidade antes de sofisticação.
- MVP vendável antes de ERP completo.
- Multi-tenant por coluna `company_id`.
- API REST bem organizada.
- Banco relacional como fonte principal da verdade.
- Isolamento de dados por empresa em todas as consultas.
- Deploy simples em VPS com Docker Compose.
- Evolução futura para cloud ou serviços gerenciados, sem travar o MVP.

---

## 3. Multi-tenant

O modelo inicial será multi-tenant por coluna.

Quase todas as tabelas operacionais devem possuir `company_id`.

Exemplos:

```txt
customers.company_id
products.company_id
stock_movements.company_id
quotes.company_id
quote_items.company_id ou herdado via quote
```

### Regra obrigatória

Toda consulta de dados operacionais deve filtrar pelo `company_id` do usuário autenticado.

Exemplo conceitual:

```sql
SELECT * FROM products
WHERE company_id = :authenticatedCompanyId;
```

### Não fazer no MVP

- Não criar um banco por empresa.
- Não criar schema separado por empresa.
- Não permitir seleção manual de `company_id` pelo frontend.
- Não confiar em `company_id` enviado no body da requisição.

O backend deve derivar a empresa a partir do usuário autenticado.

---

## 4. Backend

### Tecnologia

- Quarkus
- Java 21
- PostgreSQL
- Hibernate ORM com Panache
- RESTEasy Reactive
- SmallRye JWT
- Flyway
- Bean Validation
- SmallRye OpenAPI
- JUnit 5
- RestAssured

### Organização sugerida

```txt
backend/src/main/java/com/stockflow/
├── auth/
├── companies/
├── users/
├── customers/
├── products/
├── stock/
├── quotes/
├── publicquotes/
├── dashboard/
├── shared/
│   ├── config/
│   ├── exception/
│   ├── security/
│   └── pagination/
└── audit/
```

### Camadas recomendadas

Cada módulo deve seguir, quando fizer sentido:

```txt
Resource / Controller
  ↓
Service
  ↓
Repository
  ↓
Entity
```

Exemplo:

```txt
ProductResource
ProductService
ProductRepository
ProductEntity
ProductCreateRequest
ProductUpdateRequest
ProductResponse
```

---

## 5. Frontend

### Tecnologia

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod

### Organização sugerida

```txt
frontend/src/
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── customers/
│   ├── products/
│   ├── stock/
│   ├── quotes/
│   └── public/quotes/[token]/
├── components/
│   ├── ui/
│   ├── layout/
│   └── forms/
├── features/
│   ├── auth/
│   ├── customers/
│   ├── products/
│   ├── stock/
│   ├── quotes/
│   └── dashboard/
├── lib/
├── services/
└── types/
```

### Regra para o Codex

Não colocar toda lógica dentro das páginas. Criar services, hooks e componentes reutilizáveis.

### Testes frontend

- Usar Vitest como test runner.
- Usar React Testing Library para componentes, páginas simples e interações.
- Criar testes básicos para componentes reutilizáveis, hooks e fluxos de formulário quando forem introduzidos.
- Mockar chamadas HTTP nos testes de frontend.
- Cada módulo novo deve ter pelo menos testes mínimos para os componentes/hooks principais entregues na fase.

---

## 6. Testes

Toda fase implementada deve vir acompanhada de testes automatizados proporcionais ao escopo.

### Backend

- Usar JUnit 5 para testes unitários e de integração.
- Usar RestAssured para endpoints REST.
- Criar testes de service quando houver regra de negócio relevante fora do Resource.
- Cobrir validações, respostas HTTP principais, autenticação/autorização e isolamento por `company_id` quando o módulo envolver dados multi-tenant.
- Testes não devem depender de dados de outra empresa ou de estado manual do banco.

### Frontend

- Usar Vitest e React Testing Library.
- Testar componentes reutilizáveis, hooks e formulários criados em cada fase.
- Cobrir estados básicos de carregamento, erro e sucesso quando existirem.
- Mockar serviços HTTP e dependências externas.

### Critério arquitetural obrigatório

Antes de declarar qualquer fase como concluída, os comandos de teste do backend e do frontend devem ser executados. Falhas devem ser corrigidas dentro da própria fase.

---

## 7. Banco de dados

### Entidades principais

```txt
companies
users
customers
products
services
stock_movements
quotes
quote_items
public_quote_tokens
plans
subscriptions
audit_logs
```

---

## 8. Segurança

### Autenticação

- Login com e-mail e senha.
- Senha com hash seguro.
- JWT com expiração.
- Refresh token pode ficar fora do MVP inicial, se necessário.

### Autorização

Papéis iniciais:

```txt
OWNER
ADMIN
MEMBER
```

### Regras

- OWNER pode gerenciar empresa, usuários e tudo do tenant.
- ADMIN pode gerenciar cadastros e operações.
- MEMBER pode cadastrar clientes, produtos, estoque e orçamentos.
- Toda rota privada exige JWT válido.
- Toda rota privada precisa validar o `company_id`.

---

## 9. Proposta pública

A proposta pública deve ser acessada por token seguro.

Exemplo:

```txt
GET /public/quotes/{token}
```

Regras:

- Não exigir login.
- Token deve ser difícil de adivinhar.
- Token deve apontar para uma proposta específica.
- Link deve respeitar validade da proposta.
- Aprovação pública deve mudar status do orçamento para `APPROVED`.
- Após aprovação, estoque deve ser baixado automaticamente.

---

## 10. PDF

No MVP, o PDF pode ser gerado sob demanda.

Opções futuras:

- gerar e salvar PDF em storage;
- salvar logo da empresa;
- salvar histórico de PDFs gerados.

No MVP, priorizar funcionamento simples.

---

## 11. Deploy

### Desenvolvimento

```txt
Frontend: localhost:3000
Backend: localhost:8080
PostgreSQL: localhost:5432
```

### Produção inicial em VPS

```txt
Nginx/Traefik
Frontend
Backend
PostgreSQL
```

### Comandos iniciais

```bash
docker compose up -d --build
docker compose logs -f
docker compose down
```

---

## 12. Observabilidade mínima

Para o MVP:

- logs do Docker;
- health check do backend;
- health check do frontend;
- endpoint `/q/health` do Quarkus;
- backup diário do PostgreSQL.

Futuro:

- Uptime Kuma;
- Grafana;
- Loki;
- Sentry.
