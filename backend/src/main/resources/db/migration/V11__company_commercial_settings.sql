alter table companies
    add column trade_name varchar(160),
    add column legal_name varchar(180),
    add column whatsapp varchar(32),
    add column address varchar(180),
    add column address_number varchar(30),
    add column address_complement varchar(120),
    add column neighborhood varchar(120),
    add column city varchar(120),
    add column state varchar(2),
    add column zip_code varchar(20),
    add column default_quote_notes text,
    add column default_payment_terms text,
    add column default_quote_validity_days integer;
