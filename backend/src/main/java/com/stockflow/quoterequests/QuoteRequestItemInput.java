package com.stockflow.quoterequests;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record QuoteRequestItemInput(
        UUID productId,
        @Size(max = 500)
        String description,
        @NotNull @DecimalMin(value = "0.001")
        BigDecimal quantity,
        @Size(max = 1000)
        String notes
) {
}
