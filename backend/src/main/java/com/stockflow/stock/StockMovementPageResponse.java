package com.stockflow.stock;

import java.util.List;

public record StockMovementPageResponse(
        List<StockMovementResponse> items,
        int page,
        int size,
        long total
) {
}
