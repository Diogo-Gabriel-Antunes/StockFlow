create table products (
    id uuid primary key,
    company_id uuid not null references companies(id),
    name varchar(160) not null,
    sku varchar(80),
    category varchar(120),
    cost_price numeric(12, 2) not null default 0,
    sale_price numeric(12, 2) not null default 0,
    unit varchar(20) not null,
    stock_quantity numeric(12, 3) not null default 0,
    minimum_stock numeric(12, 3) not null default 0,
    active boolean not null default true,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_products_company_active_name on products (company_id, active, name);
create index idx_products_company_active_sku on products (company_id, active, sku);

create table services (
    id uuid primary key,
    company_id uuid not null references companies(id),
    name varchar(160) not null,
    description varchar(1000),
    default_price numeric(12, 2) not null default 0,
    estimated_cost numeric(12, 2) not null default 0,
    active boolean not null default true,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_services_company_active_name on services (company_id, active, name);
