package com.stockflow.quotes;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record QuoteRequest(
        @NotNull UUID customerId,
        LocalDate validUntil,
        @DecimalMin(value = "0.00") BigDecimal discount,
        @DecimalMin(value = "0.00") BigDecimal shipping,
        @Size(max = 1000) String notes,
        @Size(max = 500) String paymentTerms,
        @NotNull @Size(min = 1) List<@Valid QuoteItemRequest> items
) {
}
