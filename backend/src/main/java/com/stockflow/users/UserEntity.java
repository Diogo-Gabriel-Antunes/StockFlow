package com.stockflow.users;

import com.stockflow.companies.CompanyEntity;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    public CompanyEntity company;

    @Column(nullable = false)
    public String name;

    @Column(nullable = false)
    public String email;

    @Column(name = "password_hash", nullable = false)
    public String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public UserRole role;

    @Column(nullable = false)
    public boolean active = true;

    @Column(name = "created_at", nullable = false)
    public OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        email = normalizeEmail(email);
        var now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        email = normalizeEmail(email);
        updatedAt = OffsetDateTime.now();
    }

    public static String normalizeEmail(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }
}
