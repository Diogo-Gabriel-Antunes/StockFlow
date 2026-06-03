insert into companies (
    id,
    name,
    document,
    email,
    phone,
    logo_url,
    created_at,
    updated_at
)
select
    '00000000-0000-0000-0000-000000000001',
    'StockFlow Demo',
    null,
    'admin@stockflow.local',
    null,
    null,
    current_timestamp,
    current_timestamp
where not exists (
    select 1
    from companies
    where id = '00000000-0000-0000-0000-000000000001'
);

insert into users (
    id,
    company_id,
    name,
    email,
    password_hash,
    role,
    active,
    created_at,
    updated_at
)
select
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'Admin StockFlow',
    'admin@stockflow.local',
    'pbkdf2_sha256$120000$AQIDBAUGBwgJCgsMDQ4PEA==$/H4PBxZJ+V6gTo+23tWi4CHVki75X/aWI7lVF4r7wLg=',
    'OWNER',
    true,
    current_timestamp,
    current_timestamp
where not exists (
    select 1
    from users
    where lower(email) = lower('admin@stockflow.local')
);
