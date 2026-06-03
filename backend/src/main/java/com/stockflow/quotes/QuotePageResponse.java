package com.stockflow.quotes;

import java.util.List;

public record QuotePageResponse(
        List<QuoteResponse> items,
        int page,
        int size,
        long total
) {
}
