package com.stockflow.quoterequests;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record QuoteRequestResponse(
        UUID id,
        UUID customerId,
        String customerName,
        String title,
        String description,
        QuoteRequestStatus status,
        UUID convertedQuoteId,
        String convertedQuoteCode,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime cancelledAt,
        OffsetDateTime convertedAt,
        boolean canEdit,
        boolean canCancel,
        List<QuoteRequestItemResponse> items
) {
    public static QuoteRequestResponse from(QuoteRequestEntity request) {
        boolean editable = request.status == QuoteRequestStatus.REQUESTED;
        return new QuoteRequestResponse(
                request.id,
                request.customer.id,
                request.customer.name,
                request.title,
                request.description,
                request.status,
                request.convertedQuote == null ? null : request.convertedQuote.id,
                request.convertedQuote == null ? null : request.convertedQuote.code,
                request.createdAt,
                request.updatedAt,
                request.cancelledAt,
                request.convertedAt,
                editable,
                editable,
                request.items.stream().map(QuoteRequestItemResponse::from).toList()
        );
    }
}
