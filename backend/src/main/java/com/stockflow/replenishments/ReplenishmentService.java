package com.stockflow.replenishments;

import com.stockflow.products.ProductRepository;
import com.stockflow.shared.security.AuthenticatedTenant;
import com.stockflow.stock.StockMovementResponse;
import com.stockflow.stock.StockService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ReplenishmentService {

    @Inject
    ProductRepository productRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    @Inject
    ReplenishmentCalculator replenishmentCalculator;

    @Inject
    StockService stockService;

    public List<ReplenishmentProductResponse> listCriticalProducts() {
        UUID companyId = authenticatedTenant.companyId();
        return productRepository.find("company.id = ?1 and active = true and stockQuantity <= minimumStock", companyId)
                .list()
                .stream()
                .map(product -> new ReplenishmentProductResponse(
                        product.id,
                        product.name,
                        product.sku,
                        product.category,
                        product.unit,
                        product.stockQuantity,
                        product.minimumStock,
                        replenishmentCalculator.suggestedPurchaseQuantity(product)
                ))
                .toList();
    }

    @Transactional
    public ReplenishmentEntryResponse registerEntry(ReplenishmentEntryRequest request) {
        UUID replenishmentId = UUID.randomUUID();
        StockMovementResponse movement = stockService.entryWithReference(
                request.productId(),
                request.quantity(),
                reason(request.reason()),
                "REPLENISHMENT",
                replenishmentId
        );
        return new ReplenishmentEntryResponse(replenishmentId, movement);
    }

    private String reason(String reason) {
        if (reason == null || reason.isBlank()) {
            return "Reposicao de estoque";
        }
        return reason.trim();
    }
}
