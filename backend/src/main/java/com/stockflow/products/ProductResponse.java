package com.stockflow.products;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        UUID companyId,
        String name,
        String sku,
        String category,
        String barcode,
        String referenceCode,
        BigDecimal costPrice,
        BigDecimal salePrice,
        String unit,
        BigDecimal stockQuantity,
        BigDecimal minimumStock,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProductResponse from(ProductEntity product) {
        return new ProductResponse(
                product.id,
                product.company.id,
                product.name,
                product.sku,
                product.category,
                product.barcode,
                product.referenceCode,
                product.costPrice,
                product.salePrice,
                product.unit,
                product.stockQuantity,
                product.minimumStock,
                product.active,
                product.createdAt,
                product.updatedAt
        );
    }
}
