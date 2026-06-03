create table companies (
    id uuid primary key,
    name varchar(160) not null,
    document varchar(32),
    email varchar(160),
    phone varchar(32),
    logo_url varchar(500),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table users (
    id uuid primary key,
    company_id uuid not null references companies(id),
    name varchar(160) not null,
    email varchar(160) not null,
    password_hash varchar(255) not null,
    role varchar(20) not null,
    active boolean not null default true,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create unique index uq_users_email_lower on users (lower(email));
create index idx_users_company_id on users (company_id);
