CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id),
    type VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    source_type VARCHAR(80),
    source_id UUID,
    link VARCHAR(500),
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_notifications_company_created_at
ON notifications(company_id, created_at DESC);

CREATE INDEX idx_notifications_company_read_at
ON notifications(company_id, read_at);

CREATE INDEX idx_notifications_company_type
ON notifications(company_id, type);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id),
    actor_type VARCHAR(40) NOT NULL,
    actor_user_id UUID NULL REFERENCES users(id),
    actor_customer_id UUID NULL REFERENCES customers(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(80),
    entity_id UUID,
    description TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_activity_logs_company_created_at
ON activity_logs(company_id, created_at DESC);

CREATE INDEX idx_activity_logs_company_entity
ON activity_logs(company_id, entity_type, entity_id);

CREATE INDEX idx_activity_logs_company_action
ON activity_logs(company_id, action);
