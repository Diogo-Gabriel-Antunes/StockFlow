package com.stockflow.stock;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.products.ProductEntity;
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
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_movements")
public class StockMovementEntity extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    public CompanyEntity company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    public ProductEntity product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public StockMovementType type;

    @Column(nullable = false)
    public BigDecimal quantity;

    @Column(name = "previous_quantity", nullable = false)
    public BigDecimal previousQuantity;

    @Column(name = "new_quantity", nullable = false)
    public BigDecimal newQuantity;

    public String reason;

    @Column(name = "reference_type")
    public String referenceType;

    @Column(name = "reference_id")
    public UUID referenceId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    public UserEntity createdBy;

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
