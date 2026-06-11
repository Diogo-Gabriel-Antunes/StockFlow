package com.stockflow.replenishments;

import java.math.BigDecimal;
import java.util.UUID;

public record ReplenishmentProductResponse(
        UUID id,
        UUID productId,
        String name,
        String sku,
        String barcode,
        String referenceCode,
        String category,
        String unit,
        BigDecimal stockQuantity,
        BigDecimal minimumStock,
        BigDecimal suggestedQuantity,
        BigDecimal suggestedPurchaseQuantity,
        String status
) {
}
