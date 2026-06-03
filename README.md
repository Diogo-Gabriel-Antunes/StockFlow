# StockFlow

StockFlow é um SaaS B2B para pequenos fornecedores que precisam criar orçamentos profissionais, controlar estoque simples e acompanhar reposição de produtos sem depender de planilhas, Word e WhatsApp.

O nicho inicial do produto será:

- Fornecedores pet
- Pequenas confecções

O posicionamento inicial é:

> Sistema de orçamento com estoque integrado para pequenos negócios.

---

## Objetivo do MVP

Criar uma aplicação SaaS multi-tenant onde cada empresa consegue:

- cadastrar clientes;
- cadastrar produtos e serviços;
- controlar estoque simples;
- criar orçamentos;
- gerar proposta em PDF;
- compartilhar proposta por link público;
- permitir aprovação da proposta;
- baixar estoque automaticamente após aprovação;
- visualizar alertas de reposição;
- acompanhar indicadores básicos no dashboard.

---

## Stack técnica

### Backend

- Java 21
- Quarkus
- REST API
- PostgreSQL
- Hibernate ORM com Panache
- JWT
- Bean Validation
- Flyway para migrations
- SmallRye OpenAPI / Swagger UI

### Frontend

- React
- Next.js
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL
- VPS Linux
- Nginx ou Traefik em produção
- HTTPS com Let's Encrypt em produção

---

## Módulos do MVP

1. Autenticação
2. Empresas / Multi-tenant
3. Clientes
4. Produtos e serviços
5. Estoque simples
6. Orçamentos
7. Proposta em PDF e link público
8. Reposição / Compras
9. Dashboard

---

## Estrutura sugerida do repositório

```txt
stockflow/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SPEC.md
│   └── ROADMAP.md
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Como rodar localmente

Copie as variáveis de ambiente:

```bash
cp .env.example .env
```

Suba os containers:

```bash
docker compose up -d --build
```

Acesse:

```txt
Frontend: http://localhost:3000
Backend:  http://localhost:8080
Swagger:  http://localhost:8080/q/swagger-ui
PostgreSQL: localhost:5432
```

---

## Convenções para o Codex

Ao implementar este projeto, siga estas regras:

1. Não transforme o MVP em ERP completo.
2. Sempre manter isolamento multi-tenant por `company_id`.
3. Toda entidade operacional deve pertencer a uma empresa.
4. Nunca retornar dados de outra empresa na API.
5. Usar DTOs para entrada e saída.
6. Não expor entidades JPA diretamente nos endpoints.
7. Criar migrations para qualquer alteração de banco.
8. Criar validações de entrada no backend.
9. Criar componentes reutilizáveis no frontend.
10. Manter o fluxo principal simples: cliente, produto, estoque, orçamento, proposta.

---

## Fluxo principal do produto

```txt
Empresa cria conta
  ↓
Cadastra clientes
  ↓
Cadastra produtos e serviços
  ↓
Controla estoque
  ↓
Cria orçamento
  ↓
Gera proposta em PDF/link público
  ↓
Cliente aprova
  ↓
Sistema baixa estoque
  ↓
Dashboard mostra resultado e alertas
```

---

## Status do projeto

Este repositório começa na Fase 0: planejamento técnico e documentação base para implementação guiada por Codex.
