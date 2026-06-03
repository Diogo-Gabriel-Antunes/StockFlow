package com.stockflow.dashboard;

import com.stockflow.quotes.QuoteEntity;
import com.stockflow.quotes.QuoteStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record DashboardQuoteResponse(
        UUID id,
        String code,
        String customerName,
        QuoteStatus status,
        BigDecimal total,
        OffsetDateTime createdAt
) {
    public static DashboardQuoteResponse from(QuoteEntity quote) {
        return new DashboardQuoteResponse(
                quote.id,
                quote.code,
                quote.customer.name,
                quote.status,
                quote.total,
                quote.createdAt
        );
    }
}
