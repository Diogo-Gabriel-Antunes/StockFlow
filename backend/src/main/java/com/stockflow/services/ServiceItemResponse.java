package com.stockflow.services;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ServiceItemResponse(
        UUID id,
        UUID companyId,
        String name,
        String description,
        BigDecimal defaultPrice,
        BigDecimal estimatedCost,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ServiceItemResponse from(ServiceItemEntity service) {
        return new ServiceItemResponse(
                service.id,
                service.company.id,
                service.name,
                service.description,
                service.defaultPrice,
                service.estimatedCost,
                service.active,
                service.createdAt,
                service.updatedAt
        );
    }
}
