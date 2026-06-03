create table customers (
    id uuid primary key,
    company_id uuid not null references companies(id),
    name varchar(160) not null,
    type varchar(20) not null,
    document varchar(32),
    email varchar(160),
    phone varchar(32),
    whatsapp varchar(32),
    city varchar(120),
    state varchar(2),
    notes varchar(1000),
    active boolean not null default true,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_customers_company_active_name on customers (company_id, active, name);
