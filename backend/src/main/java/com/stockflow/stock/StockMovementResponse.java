package com.stockflow.stock;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record StockMovementResponse(
        UUID id,
        UUID companyId,
        UUID productId,
        String productName,
        String productSku,
        StockMovementType type,
        BigDecimal quantity,
        BigDecimal previousQuantity,
        BigDecimal newQuantity,
        String reason,
        String referenceType,
        UUID referenceId,
        UUID createdBy,
        OffsetDateTime createdAt
) {
    public static StockMovementResponse from(StockMovementEntity movement) {
        return new StockMovementResponse(
                movement.id,
                movement.company.id,
                movement.product.id,
                movement.product.name,
                movement.product.sku,
                movement.type,
                movement.quantity,
                movement.previousQuantity,
                movement.newQuantity,
                movement.reason,
                movement.referenceType,
                movement.referenceId,
                movement.createdBy.id,
                movement.createdAt
        );
    }
}
