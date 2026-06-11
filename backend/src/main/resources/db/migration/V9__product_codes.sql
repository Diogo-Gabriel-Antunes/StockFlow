alter table products add column barcode varchar(80);
alter table products add column reference_code varchar(120);

create index idx_products_company_active_barcode on products (company_id, active, barcode);
create index idx_products_company_active_reference_code on products (company_id, active, reference_code);
