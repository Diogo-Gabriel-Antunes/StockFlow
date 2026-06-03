package com.stockflow.quotes;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.customers.CustomerEntity;
import com.stockflow.users.UserEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quotes")
public class QuoteEntity extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    public CompanyEntity company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    public CustomerEntity customer;

    @Column(nullable = false)
    public String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public QuoteStatus status = QuoteStatus.DRAFT;

    @Column(name = "valid_until")
    public LocalDate validUntil;

    @Column(nullable = false)
    public BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false)
    public BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false)
    public BigDecimal shipping = BigDecimal.ZERO;

    @Column(nullable = false)
    public BigDecimal total = BigDecimal.ZERO;

    public String notes;

    @Column(name = "payment_terms")
    public String paymentTerms;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    public UserEntity createdBy;

    @Column(name = "created_at", nullable = false)
    public OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<QuoteItemEntity> items = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        var now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
