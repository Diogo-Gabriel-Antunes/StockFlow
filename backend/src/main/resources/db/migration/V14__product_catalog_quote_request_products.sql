alter table products
    add column description text,
    add column image_url varchar(500);

alter table quotes
    alter column notes type text;

alter table quote_request_items
    add column product_id uuid references products(id),
    alter column description drop not null,
    add column product_name_snapshot varchar(160),
    add column product_sku_snapshot varchar(80),
    add column product_reference_snapshot varchar(120),
    add column product_image_url_snapshot varchar(500);

create index idx_quote_request_items_product on quote_request_items (product_id);
