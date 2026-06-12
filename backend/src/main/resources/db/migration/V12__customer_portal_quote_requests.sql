alter table customers
    add column portal_token varchar(128),
    add column portal_enabled boolean not null default true,
    add column portal_token_created_at timestamp with time zone;

create unique index uq_customers_portal_token on customers (portal_token);

alter table quotes
    add column rejection_reason text,
    add column customer_decision_at timestamp with time zone;

create table quote_requests (
    id uuid primary key,
    company_id uuid not null references companies(id),
    customer_id uuid not null references customers(id),
    title varchar(180) not null,
    description text,
    status varchar(40) not null,
    converted_quote_id uuid references quotes(id),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    cancelled_at timestamp with time zone,
    converted_at timestamp with time zone
);

create index idx_quote_requests_company_status_created_at on quote_requests (company_id, status, created_at desc);
create index idx_quote_requests_company_customer on quote_requests (company_id, customer_id);

create table quote_request_items (
    id uuid primary key,
    quote_request_id uuid not null references quote_requests(id) on delete cascade,
    description varchar(500) not null,
    quantity numeric(12, 3) not null,
    notes varchar(1000),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_quote_request_items_request on quote_request_items (quote_request_id);
