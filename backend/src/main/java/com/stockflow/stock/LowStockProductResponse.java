package com.stockflow.stock;

import java.math.BigDecimal;
import java.util.UUID;

public record LowStockProductResponse(
        UUID id,
        String name,
        String sku,
        String category,
        String unit,
        BigDecimal stockQuantity,
        BigDecimal minimumStock,
        BigDecimal suggestedPurchaseQuantity
) {
}
