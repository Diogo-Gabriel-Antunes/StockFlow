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
- JUnit 5
- RestAssured

### Frontend

- React
- Next.js
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query
- Vitest
- React Testing Library

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL
- VPS Linux
- Nginx ou Traefik em produção
- Deploy por IP público em produção inicial
- HTTPS com Let's Encrypt em fase futura, quando houver domínio

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

## Deploy Oracle Cloud por IP

A Fase 10 usa Oracle Cloud Always Free com Ubuntu Server, Docker Compose e acesso somente pelo IP público da VPS.

Nesta fase não é obrigatório configurar domínio, HTTPS ou Let's Encrypt. O Nginx responde em `http://IP_DA_VPS`, encaminha a API por `http://IP_DA_VPS/api` e mantém backend e PostgreSQL internos ao Docker.

Leia [DEPLOY_ORACLE.md](DEPLOY_ORACLE.md) para configurar `.env.production`, firewall, Docker Compose, backup e validação.

Usuário padrão de desenvolvimento criado pelas migrations:

```txt
E-mail: admin@stockflow.local
Senha:  Admin123!
Perfil: OWNER
```

---

## Convenções para o Codex

Antes de qualquer implementação, o Codex deve ler e seguir obrigatoriamente o arquivo `CODEX_RULES.md`.

Esse arquivo centraliza as regras de produto, arquitetura, multi-tenant, testes obrigatórios e conclusão de fases.

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
