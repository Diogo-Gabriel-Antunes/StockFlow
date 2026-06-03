package com.stockflow.replenishments;

import com.stockflow.stock.StockMovementResponse;
import java.util.UUID;

public record ReplenishmentEntryResponse(
        UUID replenishmentId,
        StockMovementResponse movement
) {
}
