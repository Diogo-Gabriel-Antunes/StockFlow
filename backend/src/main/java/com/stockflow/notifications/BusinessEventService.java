package com.stockflow.notifications;

import com.stockflow.customers.CustomerEntity;
import com.stockflow.products.ProductEntity;
import com.stockflow.quoterequests.QuoteRequestEntity;
import com.stockflow.quotes.QuoteEntity;
import com.stockflow.users.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;

@ApplicationScoped
public class BusinessEventService {

    @Inject
    NotificationService notificationService;

    @Inject
    ActivityLogService activityLogService;

    public void quoteApprovedByCustomer(QuoteEntity quote) {
        String message = "Cliente " + quote.customer.name + " aprovou a proposta " + quote.code + ".";
        notificationService.create(quote.company, NotificationType.QUOTE_APPROVED, "Proposta aprovada", message,
                "QUOTE", quote.id, "/quotes/" + quote.id);
        activityLogService.record(quote.company, ActorType.CUSTOMER, null, quote.customer,
                NotificationType.QUOTE_APPROVED.name(), "QUOTE", quote.id, message, null);
    }

    public void quoteRejectedByCustomer(QuoteEntity quote) {
        String message = "Cliente " + quote.customer.name + " recusou a proposta " + quote.code + ".";
        if (quote.rejectionReason != null && !quote.rejectionReason.isBlank()) {
            message += " Motivo: " + quote.rejectionReason;
        }
        notificationService.create(quote.company, NotificationType.QUOTE_REJECTED, "Proposta recusada", message,
                "QUOTE", quote.id, "/quotes/" + quote.id);
        activityLogService.record(quote.company, ActorType.CUSTOMER, null, quote.customer,
                NotificationType.QUOTE_REJECTED.name(), "QUOTE", quote.id, message, null);
    }

    public void quoteCompleted(QuoteEntity quote, UserEntity user) {
        String message = "Orçamento " + quote.code + " foi concluído.";
        notificationService.create(quote.company, NotificationType.QUOTE_COMPLETED, "Orçamento concluído", message,
                "QUOTE", quote.id, "/quotes/" + quote.id);
        activityLogService.record(quote.company, ActorType.INTERNAL_USER, user, null,
                NotificationType.QUOTE_COMPLETED.name(), "QUOTE", quote.id, message, null);
    }

    public void quoteRequestCreated(QuoteRequestEntity request) {
        String message = "Cliente " + request.customer.name + " criou uma nova solicitação de orçamento.";
        notificationService.create(request.company, NotificationType.QUOTE_REQUEST_CREATED, "Nova solicitação de orçamento", message,
                "QUOTE_REQUEST", request.id, "/quote-requests/" + request.id);
        activityLogService.record(request.company, ActorType.CUSTOMER, null, request.customer,
                NotificationType.QUOTE_REQUEST_CREATED.name(), "QUOTE_REQUEST", request.id, message, null);
    }

    public void quoteRequestCancelledByCustomer(QuoteRequestEntity request) {
        String message = "Cliente " + request.customer.name + " cancelou uma solicitação de orçamento.";
        notificationService.create(request.company, NotificationType.QUOTE_REQUEST_CANCELLED, "Solicitação cancelada", message,
                "QUOTE_REQUEST", request.id, "/quote-requests/" + request.id);
        activityLogService.record(request.company, ActorType.CUSTOMER, null, request.customer,
                NotificationType.QUOTE_REQUEST_CANCELLED.name(), "QUOTE_REQUEST", request.id, message, null);
    }

    public void quoteRequestConverted(QuoteRequestEntity request, QuoteEntity quote, UserEntity user) {
        String message = "Solicitação de " + request.customer.name + " foi convertida em orçamento " + quote.code + ".";
        notificationService.create(request.company, NotificationType.QUOTE_REQUEST_CONVERTED, "Solicitação convertida", message,
                "QUOTE", quote.id, "/quotes/" + quote.id);
        activityLogService.record(request.company, ActorType.INTERNAL_USER, user, null,
                NotificationType.QUOTE_REQUEST_CONVERTED.name(), "QUOTE_REQUEST", request.id, message, null);
    }

    public void stockLow(ProductEntity product, BigDecimal previousQuantity, BigDecimal newQuantity) {
        if (previousQuantity.compareTo(product.minimumStock) > 0 && newQuantity.compareTo(product.minimumStock) <= 0) {
            String message = "Produto " + product.name + " ficou abaixo do estoque mínimo.";
            notificationService.create(product.company, NotificationType.STOCK_LOW, "Estoque baixo", message,
                    "PRODUCT", product.id, "/stock/replenishment");
            activityLogService.record(product.company, ActorType.SYSTEM, null, null,
                    NotificationType.STOCK_LOW.name(), "PRODUCT", product.id, message, null);
        }
    }

    public void stockOut(ProductEntity product, BigDecimal previousQuantity, BigDecimal newQuantity) {
        if (previousQuantity.compareTo(BigDecimal.ZERO) > 0 && newQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            String message = "Produto " + product.name + " ficou sem estoque.";
            notificationService.create(product.company, NotificationType.STOCK_OUT, "Produto sem estoque", message,
                    "PRODUCT", product.id, "/stock/replenishment");
            activityLogService.record(product.company, ActorType.SYSTEM, null, null,
                    NotificationType.STOCK_OUT.name(), "PRODUCT", product.id, message, null);
        }
    }

    public void restockRegistered(ProductEntity product, BigDecimal quantity, UserEntity user) {
        String message = "Reposição de " + quantity.stripTrailingZeros().toPlainString()
                + " unidade(s) registrada para " + product.name + ".";
        notificationService.create(product.company, NotificationType.RESTOCK_REGISTERED, "Reposição registrada", message,
                "PRODUCT", product.id, "/stock/movements");
        activityLogService.record(product.company, ActorType.INTERNAL_USER, user, null,
                NotificationType.RESTOCK_REGISTERED.name(), "PRODUCT", product.id, message, null);
    }
}
