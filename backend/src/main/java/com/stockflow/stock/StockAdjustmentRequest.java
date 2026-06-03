package com.stockflow.stock;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record StockAdjustmentRequest(
        @NotNull UUID productId,
        @NotNull @DecimalMin(value = "0.000") BigDecimal newQuantity,
        @Size(max = 500) String reason
) {
}
