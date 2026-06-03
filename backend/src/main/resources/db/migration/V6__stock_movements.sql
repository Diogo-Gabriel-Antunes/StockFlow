create table stock_movements (
    id uuid primary key,
    company_id uuid not null references companies(id),
    product_id uuid not null references products(id),
    type varchar(20) not null,
    quantity numeric(12, 3) not null,
    previous_quantity numeric(12, 3) not null,
    new_quantity numeric(12, 3) not null,
    reason varchar(500),
    reference_type varchar(40),
    reference_id uuid,
    created_by uuid not null references users(id),
    created_at timestamp with time zone not null
);

create index idx_stock_movements_company_created_at on stock_movements (company_id, created_at desc);
create index idx_stock_movements_product_created_at on stock_movements (product_id, created_at desc);
