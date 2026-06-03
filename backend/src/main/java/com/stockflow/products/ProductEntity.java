package com.stockflow.products;

import com.stockflow.companies.CompanyEntity;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
public class ProductEntity extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    public CompanyEntity company;

    @Column(nullable = false)
    public String name;

    public String sku;
    public String category;

    @Column(name = "cost_price", nullable = false)
    public BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "sale_price", nullable = false)
    public BigDecimal salePrice = BigDecimal.ZERO;

    @Column(nullable = false)
    public String unit;

    @Column(name = "stock_quantity", nullable = false)
    public BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(name = "minimum_stock", nullable = false)
    public BigDecimal minimumStock = BigDecimal.ZERO;

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
        var now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
