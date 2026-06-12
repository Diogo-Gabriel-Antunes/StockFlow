package com.stockflow.quotes;

import com.stockflow.stock.StockMovementEntity;
import com.stockflow.stock.StockMovementRepository;
import com.stockflow.stock.StockMovementType;
import com.stockflow.notifications.BusinessEventService;
import com.stockflow.users.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class QuoteApprovalService {

    @Inject
    StockMovementRepository stockMovementRepository;

    @Inject
    BusinessEventService businessEventService;

    public QuoteEntity markCustomerApproved(QuoteEntity quote) {
        if (quote.validUntil != null && quote.validUntil.isBefore(LocalDate.now())) {
            quote.status = QuoteStatus.EXPIRED;
            throw new BadRequestException("Quote is expired");
        }
        if (quote.status == QuoteStatus.CUSTOMER_APPROVED) {
            return quote;
        }
        if (isFinal(quote.status)) {
            throw new BadRequestException("Quote cannot be approved in current status");
        }
        if (quote.status != QuoteStatus.SENT) {
            throw new BadRequestException("Only sent quotes can be approved by the customer");
        }
        quote.status = QuoteStatus.CUSTOMER_APPROVED;
        quote.customerApprovedAt = OffsetDateTime.now();
        quote.customerDecisionAt = quote.customerApprovedAt;
        return quote;
    }

    public QuoteEntity complete(QuoteEntity quote, UserEntity completedBy) {
        if (quote.status == QuoteStatus.COMPLETED || quote.stockDeducted) {
            throw new BadRequestException("Este orçamento já foi concluído.");
        }
        if (quote.status != QuoteStatus.CUSTOMER_APPROVED) {
            throw new BadRequestException("Apenas orçamentos aprovados pelo cliente podem ser concluídos.");
        }

        Map<UUID, ProductDeduction> deductions = aggregateProductDeductions(quote);
        for (ProductDeduction deduction : deductions.values()) {
            if (deduction.product.stockQuantity.compareTo(deduction.quantity) < 0) {
                throw new BadRequestException("Estoque insuficiente para concluir o orçamento.");
            }
        }

        for (ProductDeduction deduction : deductions.values()) {
            applySaleMovement(deduction, quote, completedBy);
        }

        quote.status = QuoteStatus.COMPLETED;
        quote.stockDeducted = true;
        quote.completedAt = OffsetDateTime.now();
        quote.completedBy = completedBy;
        return quote;
    }

    private Map<UUID, ProductDeduction> aggregateProductDeductions(QuoteEntity quote) {
        Map<UUID, ProductDeduction> deductions = new LinkedHashMap<>();
        for (QuoteItemEntity item : quote.items) {
            if (item.itemType != QuoteItemType.PRODUCT) {
                continue;
            }
            deductions.compute(item.product.id, (id, current) -> {
                if (current == null) {
                    return new ProductDeduction(item.product, item.quantity);
                }
                current.quantity = current.quantity.add(item.quantity);
                return current;
            });
        }
        return deductions;
    }

    private void applySaleMovement(ProductDeduction deduction, QuoteEntity quote, UserEntity completedBy) {
        BigDecimal previousQuantity = deduction.product.stockQuantity;
        BigDecimal newQuantity = previousQuantity.subtract(deduction.quantity);
        deduction.product.stockQuantity = newQuantity;

        StockMovementEntity movement = new StockMovementEntity();
        movement.company = quote.company;
        movement.product = deduction.product;
        movement.type = StockMovementType.SALE;
        movement.quantity = deduction.quantity;
        movement.previousQuantity = previousQuantity;
        movement.newQuantity = newQuantity;
        movement.reason = "Baixa automática ao concluir orçamento";
        movement.referenceType = "QUOTE";
        movement.referenceId = quote.id;
        movement.createdBy = completedBy;
        stockMovementRepository.persist(movement);
        businessEventService.stockLow(deduction.product, previousQuantity, newQuantity);
        businessEventService.stockOut(deduction.product, previousQuantity, newQuantity);
    }

    private boolean isFinal(QuoteStatus status) {
        return status == QuoteStatus.COMPLETED
                || status == QuoteStatus.REJECTED
                || status == QuoteStatus.CANCELLED
                || status == QuoteStatus.EXPIRED;
    }

    private static class ProductDeduction {
        private final com.stockflow.products.ProductEntity product;
        private BigDecimal quantity;

        private ProductDeduction(com.stockflow.products.ProductEntity product, BigDecimal quantity) {
            this.product = product;
            this.quantity = quantity;
        }
    }
}
