# SPEC.md — StockFlow

## 1. Produto

StockFlow é um SaaS para pequenos fornecedores criarem orçamentos profissionais com controle de estoque integrado.

## 2. Nicho inicial

O MVP será pensado inicialmente para:

- fornecedores pet;
- pequenas confecções.

Esses nichos possuem produtos físicos, vendas recorrentes, necessidade de reposição e uso frequente de orçamento/proposta.

---

## 3. Problema

Pequenas empresas normalmente usam:

- Excel;
- WhatsApp;
- Word;
- caderno;
- controle manual de estoque;
- propostas sem padrão.

Isso gera:

- perda de controle;
- orçamento demorado;
- estoque desatualizado;
- dificuldade para saber o que comprar;
- baixa percepção profissional pelo cliente.

---

## 4. Proposta de valor

> Crie propostas bonitas, envie por link ou PDF e saiba automaticamente quando precisa repor estoque.

---

## 5. Usuários

### Dono da empresa

Quer vender mais, organizar produtos, controlar estoque e acompanhar resultados.

### Funcionário administrativo/comercial

Quer cadastrar clientes, produtos, montar orçamentos e enviar propostas rapidamente.

### Cliente final

Recebe link ou PDF da proposta, visualiza os itens e pode aprovar.

---

## 6. Módulos do MVP

## 6.1 Autenticação

### Funcionalidades

- Cadastro inicial.
- Login.
- Logout.
- Usuário autenticado.
- Proteção de rotas.
- Hash de senha.
- JWT.

### Endpoints

```txt
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Critérios de aceite

- Usuário consegue criar uma conta.
- Ao criar conta, uma empresa também é criada.
- Usuário consegue fazer login.
- Rotas privadas recusam acesso sem token.
- Token contém identificação do usuário e empresa.

---

## 6.2 Empresas / Multi-tenant

### Funcionalidades

- Criar empresa no cadastro inicial.
- Editar dados básicos da empresa.
- Isolar dados por empresa.

### Campos da empresa

```txt
id
name
document
email
phone
logo_url
created_at
updated_at
```

### Critérios de aceite

- Cada usuário pertence a uma empresa.
- Dados de uma empresa não aparecem para outra.
- Toda entidade operacional possui relação com empresa.

---

## 6.3 Clientes

### Campos

```txt
id
company_id
name
type
document
email
phone
whatsapp
city
state
notes
created_at
updated_at
```

### Funcionalidades

- Listar clientes.
- Criar cliente.
- Editar cliente.
- Ver detalhes.
- Inativar ou excluir cliente.

### Endpoints

```txt
GET    /customers
POST   /customers
GET    /customers/{id}
PUT    /customers/{id}
DELETE /customers/{id}
```

### Critérios de aceite

- Cliente sempre pertence à empresa autenticada.
- Usuário não consegue acessar cliente de outra empresa.
- Nome é obrigatório.
- CPF/CNPJ pode ser opcional no MVP.

---

## 6.4 Produtos e serviços

### Produto

Campos:

```txt
id
company_id
name
sku
category
cost_price
sale_price
unit
stock_quantity
minimum_stock
active
created_at
updated_at
```

### Serviço

Campos:

```txt
id
company_id
name
description
default_price
estimated_cost
active
created_at
updated_at
```

### Funcionalidades

- CRUD de produtos.
- CRUD de serviços.
- Ativar/inativar.
- Buscar por nome ou SKU.
- Definir estoque mínimo.

### Critérios de aceite

- Produto pode ter estoque.
- Serviço não precisa ter estoque.
- Produto inativo não deve aparecer como opção padrão em novos orçamentos.
- Preço de venda deve ser maior ou igual a zero.

---

## 6.5 Estoque simples

### Tipos de movimentação

```txt
IN
OUT
ADJUSTMENT
SALE
CANCELLATION
```

### Campos

```txt
id
company_id
product_id
type
quantity
previous_quantity
new_quantity
reason
reference_type
reference_id
created_by
created_at
```

### Funcionalidades

- Entrada manual.
- Saída manual.
- Ajuste manual.
- Histórico por produto.
- Alerta de estoque baixo.
- Baixa automática ao aprovar orçamento.

### Endpoints

```txt
GET  /stock/movements
GET  /stock/low
POST /stock/entries
POST /stock/outputs
POST /stock/adjustments
```

### Critérios de aceite

- Não permitir estoque negativo, salvo se configuração futura permitir.
- Toda alteração gera movimentação.
- Aprovação de orçamento gera movimentação tipo `SALE`.
- Produto abaixo do mínimo aparece em reposição.

---

## 6.6 Orçamentos

### Status

```txt
DRAFT
SENT
APPROVED
REJECTED
EXPIRED
CANCELLED
```

### Campos do orçamento

```txt
id
company_id
customer_id
code
status
valid_until
subtotal
discount
shipping
total
notes
payment_terms
created_by
created_at
updated_at
```

### Campos dos itens

```txt
id
company_id
quote_id
item_type
product_id
service_id
description
quantity
unit_price
discount
total
```

### Funcionalidades

- Criar orçamento.
- Adicionar produtos.
- Adicionar serviços.
- Calcular subtotal.
- Aplicar desconto.
- Aplicar frete.
- Calcular total.
- Alterar status.
- Gerar proposta.

### Endpoints

```txt
GET    /quotes
POST   /quotes
GET    /quotes/{id}
PUT    /quotes/{id}
DELETE /quotes/{id}
POST   /quotes/{id}/send
POST   /quotes/{id}/approve
POST   /quotes/{id}/reject
GET    /quotes/{id}/pdf
```

### Critérios de aceite

- Orçamento precisa ter cliente.
- Orçamento precisa ter pelo menos um item para ser enviado.
- Total deve ser calculado pelo backend.
- Frontend pode exibir cálculo preliminar, mas backend é a fonte da verdade.
- Ao aprovar, estoque dos produtos deve ser baixado.
- Serviços não movimentam estoque.

---

## 6.7 Proposta em PDF e link público

### Funcionalidades

- Gerar PDF.
- Gerar token público.
- Visualizar proposta por link.
- Aprovar proposta pelo link.
- Recusar proposta pelo link.

### Endpoints

```txt
GET  /public/quotes/{token}
POST /public/quotes/{token}/approve
POST /public/quotes/{token}/reject
```

### Critérios de aceite

- Link público não exige login.
- Token não pode expor ID sequencial.
- Link mostra dados da empresa, cliente, itens, valores e validade.
- Aprovação muda orçamento para `APPROVED`.
- Aprovação baixa estoque.
- Link expirado não permite aprovação.

---

## 6.8 Reposição / Compras

### Funcionalidades

- Listar produtos abaixo do estoque mínimo.
- Exibir estoque atual.
- Exibir estoque mínimo.
- Sugerir quantidade de compra.
- Registrar entrada após reposição.

### Critérios de aceite

- Produto com estoque atual menor ou igual ao mínimo aparece na lista.
- Usuário consegue registrar entrada a partir da tela de reposição.
- Registro gera movimentação de estoque.

---

## 6.9 Dashboard

### Indicadores

- Orçamentos do mês.
- Valor aprovado no mês.
- Valor em aberto.
- Taxa de aprovação.
- Produtos com estoque baixo.
- Últimos orçamentos.
- Últimos clientes.

### Endpoint

```txt
GET /dashboard/summary
```

### Critérios de aceite

- Dashboard considera apenas empresa autenticada.
- Indicadores devem carregar em uma única tela.
- Erro em um indicador não deve quebrar a aplicação inteira.

---

## 7. Regras globais

1. Toda rota privada exige autenticação.
2. Toda entidade operacional pertence a uma empresa.
3. Backend nunca deve confiar no `company_id` enviado pelo frontend.
4. Backend deve calcular valores monetários.
5. Estoque deve ter histórico de movimentação.
6. Aprovação de orçamento deve ser idempotente.
7. Não permitir aprovar duas vezes gerando baixa duplicada.
8. Excluir preferencialmente deve inativar quando houver histórico.
9. Usar paginação em listagens.
10. Usar filtros básicos por nome, status e período.

---

## 8. Telas do MVP

```txt
/login
/register
/dashboard
/customers
/customers/new
/customers/[id]
/products
/products/new
/services
/stock
/stock/low
/quotes
/quotes/new
/quotes/[id]
/public/quotes/[token]
/settings/company
```

---

## 9. Fora do MVP

Não implementar inicialmente:

- nota fiscal;
- financeiro completo;
- múltiplos depósitos;
- controle de produção avançado;
- marketplace;
- aplicativo mobile nativo;
- integração contábil;
- assinatura/pagamento completo;
- IA;
- código de barras.

---

## 10. Prompt base para o Codex

Use este projeto como um SaaS real chamado StockFlow.

Implemente fase por fase, sem pular etapas. Antes de escrever código, leia `README.md`, `ARCHITECTURE.md`, `SPEC.md`, `ROADMAP.md`, `.env.example` e `docker-compose.yml`.

Priorize:

1. backend Quarkus bem estruturado;
2. frontend Next.js organizado por features;
3. PostgreSQL com migrations;
4. multi-tenant por `company_id`;
5. autenticação JWT;
6. regras de negócio no backend;
7. UI simples e funcional;
8. Docker Compose para rodar localmente e em VPS.

Não implemente funcionalidades fora do MVP sem autorização.
