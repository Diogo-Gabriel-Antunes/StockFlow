package com.stockflow.dashboard;

import com.stockflow.products.ProductEntity;
import java.math.BigDecimal;
import java.util.UUID;

public record DashboardCriticalProductResponse(
        UUID id,
        String name,
        String sku,
        BigDecimal stockQuantity,
        BigDecimal minimumStock,
        String status
) {
    public static DashboardCriticalProductResponse from(ProductEntity product) {
        return new DashboardCriticalProductResponse(
                product.id,
                product.name,
                product.sku,
                product.stockQuantity,
                product.minimumStock,
                product.stockQuantity.signum() <= 0 ? "OUT_OF_STOCK" : "LOW_STOCK"
        );
    }
}
