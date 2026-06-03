package com.stockflow.quotes;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.products.ProductEntity;
import com.stockflow.services.ServiceItemEntity;
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
import java.util.UUID;

@Entity
@Table(name = "quote_items")
public class QuoteItemEntity extends PanacheEntityBase {

    @Id
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    public CompanyEntity company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quote_id", nullable = false)
    public QuoteEntity quote;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false)
    public QuoteItemType itemType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    public ProductEntity product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    public ServiceItemEntity service;

    @Column(nullable = false)
    public String description;

    @Column(nullable = false)
    public BigDecimal quantity;

    @Column(name = "unit_price", nullable = false)
    public BigDecimal unitPrice;

    @Column(nullable = false)
    public BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false)
    public BigDecimal total;

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
