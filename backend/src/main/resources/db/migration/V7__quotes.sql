create table quotes (
    id uuid primary key,
    company_id uuid not null references companies(id),
    customer_id uuid not null references customers(id),
    code varchar(40) not null,
    status varchar(20) not null,
    valid_until date,
    subtotal numeric(12, 2) not null default 0,
    discount numeric(12, 2) not null default 0,
    shipping numeric(12, 2) not null default 0,
    total numeric(12, 2) not null default 0,
    notes varchar(1000),
    payment_terms varchar(500),
    created_by uuid not null references users(id),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint uq_quotes_company_code unique (company_id, code)
);

create index idx_quotes_company_status_created_at on quotes (company_id, status, created_at desc);
create index idx_quotes_company_customer on quotes (company_id, customer_id);

create table quote_items (
    id uuid primary key,
    company_id uuid not null references companies(id),
    quote_id uuid not null references quotes(id) on delete cascade,
    item_type varchar(20) not null,
    product_id uuid references products(id),
    service_id uuid references services(id),
    description varchar(500) not null,
    quantity numeric(12, 3) not null,
    unit_price numeric(12, 2) not null,
    discount numeric(12, 2) not null default 0,
    total numeric(12, 2) not null
);

create index idx_quote_items_company_quote on quote_items (company_id, quote_id);
