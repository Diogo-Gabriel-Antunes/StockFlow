package com.stockflow.publicquotes;

import com.stockflow.quotes.QuoteItemResponse;
import com.stockflow.quotes.QuoteStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PublicQuoteResponse(
        String companyName,
        String companyEmail,
        String customerName,
        String code,
        QuoteStatus status,
        LocalDate validUntil,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal shipping,
        BigDecimal total,
        String notes,
        String paymentTerms,
        List<QuoteItemResponse> items
) {
    public static PublicQuoteResponse from(PublicQuoteTokenEntity token) {
        var quote = token.quote;
        return new PublicQuoteResponse(
                quote.company.name,
                quote.company.email,
                quote.customer.name,
                quote.code,
                quote.status,
                quote.validUntil,
                quote.subtotal,
                quote.discount,
                quote.shipping,
                quote.total,
                quote.notes,
                quote.paymentTerms,
                quote.items.stream().map(QuoteItemResponse::from).toList()
        );
    }
}
