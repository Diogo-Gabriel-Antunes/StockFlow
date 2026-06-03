package com.stockflow.customers;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        UUID companyId,
        String name,
        CustomerType type,
        String document,
        String email,
        String phone,
        String whatsapp,
        String city,
        String state,
        String notes,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CustomerResponse from(CustomerEntity customer) {
        return new CustomerResponse(
                customer.id,
                customer.company.id,
                customer.name,
                customer.type,
                customer.document,
                customer.email,
                customer.phone,
                customer.whatsapp,
                customer.city,
                customer.state,
                customer.notes,
                customer.active,
                customer.createdAt,
                customer.updatedAt
        );
    }
}
