package com.stockflow.customerportal;

import com.stockflow.quotes.QuoteEntity;
import com.stockflow.quotes.QuoteItemResponse;
import com.stockflow.quotes.QuoteStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CustomerPortalQuoteResponse(
        UUID id,
        String code,
        QuoteStatus status,
        String statusLabel,
        BigDecimal total,
        OffsetDateTime createdAt,
        LocalDate validUntil,
        boolean canApprove,
        boolean canReject,
        boolean canDownloadPdf,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal shipping,
        String notes,
        String paymentTerms,
        List<QuoteItemResponse> items
) {
    public static CustomerPortalQuoteResponse summary(QuoteEntity quote) {
        return from(quote, false);
    }

    public static CustomerPortalQuoteResponse detail(QuoteEntity quote) {
        return from(quote, true);
    }

    private static CustomerPortalQuoteResponse from(QuoteEntity quote, boolean includeItems) {
        boolean canDecide = quote.status == QuoteStatus.SENT;
        return new CustomerPortalQuoteResponse(
                quote.id,
                quote.code,
                quote.status,
                statusLabel(quote.status),
                quote.total,
                quote.createdAt,
                quote.validUntil,
                canDecide,
                canDecide,
                true,
                quote.subtotal,
                quote.discount,
                quote.shipping,
                firstPresent(quote.notes, quote.company.defaultQuoteNotes),
                firstPresent(quote.paymentTerms, quote.company.defaultPaymentTerms),
                includeItems ? quote.items.stream().map(QuoteItemResponse::from).toList() : List.of()
        );
    }

    private static String statusLabel(QuoteStatus status) {
        return switch (status) {
            case DRAFT -> "Rascunho";
            case SENT -> "Aguardando aprovação";
            case CUSTOMER_APPROVED -> "Aprovada pelo cliente";
            case COMPLETED -> "Concluída";
            case REJECTED -> "Recusada";
            case CANCELLED -> "Cancelada";
            case EXPIRED -> "Expirada";
        };
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
