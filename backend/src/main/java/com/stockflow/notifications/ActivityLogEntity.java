package com.stockflow.notifications;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.customers.CustomerEntity;
import com.stockflow.users.UserEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "activity_logs")
public class ActivityLogEntity extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    public CompanyEntity company;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false)
    public ActorType actorType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    public UserEntity actorUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_customer_id")
    public CustomerEntity actorCustomer;

    @Column(nullable = false, length = 100)
    public String action;

    @Column(name = "entity_type")
    public String entityType;

    @Column(name = "entity_id")
    public UUID entityId;

    @Column(nullable = false, columnDefinition = "TEXT")
    public String description;

    @Column(columnDefinition = "TEXT")
    public String metadata;

    @Column(name = "created_at", nullable = false)
    public OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = OffsetDateTime.now();
    }
}
