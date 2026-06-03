package com.stockflow.replenishments;

import java.math.BigDecimal;
import java.util.UUID;

public record ReplenishmentProductResponse(
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
