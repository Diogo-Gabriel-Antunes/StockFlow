package com.stockflow.dashboard;

import com.stockflow.products.ProductEntity;
import java.math.BigDecimal;
import java.util.UUID;

public record DashboardLowStockProductResponse(
        UUID id,
        String name,
        String sku,
        String unit,
        BigDecimal stockQuantity,
        BigDecimal minimumStock,
        BigDecimal suggestedPurchaseQuantity
) {
    public static DashboardLowStockProductResponse from(ProductEntity product) {
        BigDecimal suggested = product.minimumStock.subtract(product.stockQuantity);
        if (suggested.signum() < 0) {
            suggested = BigDecimal.ZERO;
        }
        return new DashboardLowStockProductResponse(
                product.id,
                product.name,
                product.sku,
                product.unit,
                product.stockQuantity,
                product.minimumStock,
                suggested
        );
    }
}
