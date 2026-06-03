package com.stockflow.companies;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String name,
        String document,
        String email,
        String phone,
        String logoUrl,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CompanyResponse from(CompanyEntity company) {
        return new CompanyResponse(
                company.id,
                company.name,
                company.document,
                company.email,
                company.phone,
                company.logoUrl,
                company.createdAt,
                company.updatedAt
        );
    }
}
