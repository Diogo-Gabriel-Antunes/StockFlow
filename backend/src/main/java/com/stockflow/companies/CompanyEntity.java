package com.stockflow.companies;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "companies")
public class CompanyEntity extends PanacheEntityBase {

    @Id
    public UUID id;

    @Column(nullable = false)
    public String name;

    @Column(name = "trade_name")
    public String tradeName;

    @Column(name = "legal_name")
    public String legalName;

    public String document;
    public String email;
    public String phone;
    public String whatsapp;
    public String address;

    @Column(name = "address_number")
    public String addressNumber;

    @Column(name = "address_complement")
    public String addressComplement;

    public String neighborhood;
    public String city;
    public String state;

    @Column(name = "zip_code")
    public String zipCode;

    @Column(name = "default_quote_notes")
    public String defaultQuoteNotes;

    @Column(name = "default_payment_terms")
    public String defaultPaymentTerms;

    @Column(name = "default_quote_validity_days")
    public Integer defaultQuoteValidityDays;

    @Column(name = "logo_url")
    public String logoUrl;

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
