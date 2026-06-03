package com.stockflow.quotes;

import com.stockflow.stock.StockMovementEntity;
import com.stockflow.stock.StockMovementRepository;
import com.stockflow.stock.StockMovementType;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import java.math.BigDecimal;
import java.time.LocalDate;

@ApplicationScoped
public class QuoteApprovalService {

    @Inject
    StockMovementRepository stockMovementRepository;

    public QuoteEntity approve(QuoteEntity quote) {
        if (quote.validUntil != null && quote.validUntil.isBefore(LocalDate.now())) {
            quote.status = QuoteStatus.EXPIRED;
            throw new BadRequestException("Quote is expired");
        }
        if (quote.status == QuoteStatus.APPROVED) {
            return quote;
        }
        for (QuoteItemEntity item : quote.items) {
            if (item.itemType == QuoteItemType.PRODUCT) {
                applySaleMovement(item, quote);
            }
        }
        quote.status = QuoteStatus.APPROVED;
        return quote;
    }

    private void applySaleMovement(QuoteItemEntity item, QuoteEntity quote) {
        BigDecimal previousQuantity = item.product.stockQuantity;
        BigDecimal newQuantity = previousQuantity.subtract(item.quantity);
        if (newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Stock cannot be negative");
        }

        item.product.stockQuantity = newQuantity;

        StockMovementEntity movement = new StockMovementEntity();
        movement.company = quote.company;
        movement.product = item.product;
        movement.type = StockMovementType.SALE;
        movement.quantity = item.quantity;
        movement.previousQuantity = previousQuantity;
        movement.newQuantity = newQuantity;
        movement.reason = "Quote " + quote.code + " approved";
        movement.referenceType = "QUOTE";
        movement.referenceId = quote.id;
        movement.createdBy = quote.createdBy;
        stockMovementRepository.persist(movement);
    }
}
