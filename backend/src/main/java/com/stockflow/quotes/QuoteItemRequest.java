package com.stockflow.quotes;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record QuoteItemRequest(
        @NotNull QuoteItemType itemType,
        UUID productId,
        UUID serviceId,
        @Size(max = 500) String description,
        @NotNull @DecimalMin(value = "0.001") BigDecimal quantity,
        @DecimalMin(value = "0.00") BigDecimal unitPrice,
        @DecimalMin(value = "0.00") BigDecimal discount
) {
}
