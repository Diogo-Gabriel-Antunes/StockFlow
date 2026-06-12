package com.stockflow.publicquotes;

import jakarta.validation.constraints.Size;

public record RejectPublicQuoteRequest(
        @Size(max = 1000)
        String reason
) {
}
