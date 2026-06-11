package com.stockflow.replenishments;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record RestockRequest(
        @NotNull @DecimalMin(value = "0.001") BigDecimal quantity,
        @Size(max = 500) String reason
) {
}
