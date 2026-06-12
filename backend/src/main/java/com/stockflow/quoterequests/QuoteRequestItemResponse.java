package com.stockflow.quoterequests;

import java.math.BigDecimal;
import java.util.UUID;

public record QuoteRequestItemResponse(
        UUID id,
        UUID productId,
        String description,
        BigDecimal quantity,
        String notes,
        String productNameSnapshot,
        String productSkuSnapshot,
        String productReferenceSnapshot,
        String productImageUrlSnapshot
) {
    public static QuoteRequestItemResponse from(QuoteRequestItemEntity item) {
        return new QuoteRequestItemResponse(
                item.id,
                item.product == null ? null : item.product.id,
                item.description,
                item.quantity,
                item.notes,
                item.productNameSnapshot,
                item.productSkuSnapshot,
                item.productReferenceSnapshot,
                item.productImageUrlSnapshot
        );
    }
}
