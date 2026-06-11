package com.stockflow.dashboard;

import com.stockflow.stock.StockMovementEntity;
import com.stockflow.stock.StockMovementType;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record DashboardStockMovementResponse(
        UUID id,
        String productName,
        StockMovementType type,
        BigDecimal quantity,
        BigDecimal previousQuantity,
        BigDecimal newQuantity,
        String reason,
        OffsetDateTime createdAt
) {
    public static DashboardStockMovementResponse from(StockMovementEntity movement) {
        return new DashboardStockMovementResponse(
                movement.id,
                movement.product.name,
                movement.type,
                movement.quantity,
                movement.previousQuantity,
                movement.newQuantity,
                movement.reason,
                movement.createdAt
        );
    }
}
