package com.stockflow.publicquotes;

import com.stockflow.quotes.QuoteItemResponse;
import com.stockflow.quotes.QuoteStatus;
import com.stockflow.companies.CompanySettingsResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PublicQuoteResponse(
        String companyName,
        String companyDocument,
        String companyEmail,
        String companyPhone,
        String companyWhatsapp,
        String companyCity,
        String companyState,
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
                CompanySettingsResponse.commercialName(quote.company),
                quote.company.document,
                quote.company.email,
                quote.company.phone,
                quote.company.whatsapp,
                quote.company.city,
                quote.company.state,
                quote.customer.name,
                quote.code,
                quote.status,
                quote.validUntil,
                quote.subtotal,
                quote.discount,
                quote.shipping,
                quote.total,
                firstPresent(quote.notes, quote.company.defaultQuoteNotes),
                firstPresent(quote.paymentTerms, quote.company.defaultPaymentTerms),
                quote.items.stream().map(QuoteItemResponse::from).toList()
        );
    }

    private static String firstPresent(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return null;
    }
}
