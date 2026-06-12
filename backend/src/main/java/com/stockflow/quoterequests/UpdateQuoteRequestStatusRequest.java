package com.stockflow.quoterequests;

import jakarta.validation.constraints.NotNull;

public record UpdateQuoteRequestStatusRequest(
        @NotNull
        QuoteRequestStatus status
) {
}
