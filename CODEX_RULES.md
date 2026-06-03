# CODEX_RULES.md — Regras para o Codex

Antes de qualquer implementação, o Codex deve ler:

- `README.md`
- `ARCHITECTURE.md`
- `SPEC.md`
- `ROADMAP.md`
- `.env.example`
- `docker-compose.yml`
- `CODEX_RULES.md`

---

## Regras de Produto

1. Não transformar o MVP em ERP completo.
2. Não implementar funcionalidades fora do MVP sem autorização.
3. Manter o fluxo principal simples: cliente, produto, estoque, orçamento, proposta.
4. Não avançar para a próxima fase se a fase atual não estiver rodando com Docker Compose.

---

## Regras de Arquitetura

1. Sempre manter isolamento multi-tenant por `company_id`.
2. Toda entidade operacional deve pertencer a uma empresa.
3. Nunca retornar dados de outra empresa na API.
4. O backend nunca deve confiar em `company_id` enviado pelo frontend.
5. O backend deve derivar a empresa a partir do usuário autenticado.
6. Usar DTOs para entrada e saída.
7. Não expor entidades JPA diretamente nos endpoints.
8. Criar migrations para qualquer alteração de banco.
9. Criar validações de entrada no backend.
10. Criar services, hooks e componentes reutilizáveis no frontend.
11. Não colocar toda lógica dentro das páginas.

---

## Regras de Testes

1. Toda fase implementada deve incluir testes mínimos compatíveis com o escopo entregue.
2. Cada módulo novo precisa vir com testes mínimos.
3. Backend Quarkus deve ter testes com JUnit 5, RestAssured e testes de service quando fizer sentido.
4. Frontend Next.js deve ter testes com Vitest, React Testing Library e testes básicos de componentes/hooks.
5. Antes de concluir qualquer fase, rodar os testes automatizados do backend e do frontend.
6. Corrigir todas as falhas de teste antes de considerar a fase concluída.
7. Não considerar uma fase concluída se os testes obrigatórios estiverem ausentes ou falhando.

---

## Regras por Fase

1. Implementar fase por fase, sem pular etapas.
2. Não avançar se a fase atual não estiver com Docker Compose funcional.
3. Não avançar se os testes obrigatórios da fase atual não tiverem sido criados, executados e aprovados.
4. Ao concluir uma fase, registrar quais comandos de teste/build foram executados.
5. Se algum teste não puder ser executado, informar claramente o motivo.
