package com.stockflow.quotes;

import java.math.BigDecimal;
import java.util.UUID;

public record QuoteItemResponse(
        UUID id,
        QuoteItemType itemType,
        UUID productId,
        UUID serviceId,
        String description,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal discount,
        BigDecimal total
) {
    public static QuoteItemResponse from(QuoteItemEntity item) {
        return new QuoteItemResponse(
                item.id,
                item.itemType,
                item.product == null ? null : item.product.id,
                item.service == null ? null : item.service.id,
                item.description,
                item.quantity,
                item.unitPrice,
                item.discount,
                item.total
        );
    }
}
