create table public_quote_tokens (
    id uuid primary key,
    company_id uuid not null references companies(id),
    quote_id uuid not null references quotes(id) on delete cascade,
    token varchar(120) not null unique,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone not null
);

create index idx_public_quote_tokens_quote on public_quote_tokens (quote_id);
create index idx_public_quote_tokens_company on public_quote_tokens (company_id);
