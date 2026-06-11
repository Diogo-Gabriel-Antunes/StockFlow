alter table quotes
    add column customer_approved_at timestamp with time zone,
    add column customer_rejected_at timestamp with time zone,
    add column completed_at timestamp with time zone,
    add column completed_by uuid references users(id),
    add column stock_deducted boolean not null default false;

update quotes
set status = 'COMPLETED',
    completed_at = updated_at,
    completed_by = created_by,
    stock_deducted = true
where status = 'APPROVED';
