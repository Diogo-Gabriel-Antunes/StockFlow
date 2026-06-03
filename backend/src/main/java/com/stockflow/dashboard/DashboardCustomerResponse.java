package com.stockflow.dashboard;

import com.stockflow.customers.CustomerEntity;
import java.time.OffsetDateTime;
import java.util.UUID;

public record DashboardCustomerResponse(
        UUID id,
        String name,
        String email,
        String phone,
        OffsetDateTime createdAt
) {
    public static DashboardCustomerResponse from(CustomerEntity customer) {
        return new DashboardCustomerResponse(
                customer.id,
                customer.name,
                customer.email,
                customer.phone,
                customer.createdAt
        );
    }
}
