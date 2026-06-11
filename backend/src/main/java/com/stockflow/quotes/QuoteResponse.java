package com.stockflow.quotes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record QuoteResponse(
        UUID id,
        UUID companyId,
        UUID customerId,
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
        UUID createdBy,
        OffsetDateTime customerApprovedAt,
        OffsetDateTime customerRejectedAt,
        OffsetDateTime completedAt,
        UUID completedBy,
        boolean stockDeducted,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<QuoteItemResponse> items
) {
    public static QuoteResponse from(QuoteEntity quote) {
        return new QuoteResponse(
                quote.id,
                quote.company.id,
                quote.customer.id,
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
                quote.createdBy.id,
                quote.customerApprovedAt,
                quote.customerRejectedAt,
                quote.completedAt,
                quote.completedBy == null ? null : quote.completedBy.id,
                quote.stockDeducted,
                quote.createdAt,
                quote.updatedAt,
                quote.items.stream().map(QuoteItemResponse::from).toList()
        );
    }
}
