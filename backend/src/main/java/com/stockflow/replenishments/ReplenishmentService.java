package com.stockflow.replenishments;

import com.stockflow.products.ProductRepository;
import com.stockflow.shared.security.AuthenticatedTenant;
import com.stockflow.stock.LowStockStatus;
import com.stockflow.stock.StockMovementResponse;
import com.stockflow.stock.StockService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import io.quarkus.panache.common.Sort;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ReplenishmentService {
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

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
        return productRepository.find(
                        "company.id = ?1 and active = true and stockQuantity <= minimumStock",
                        Sort.by("stockQuantity").ascending().and("name").ascending(),
                        companyId
                )
                .list()
                .stream()
                .map(product -> new ReplenishmentProductResponse(
                        product.id,
                        product.id,
                        product.name,
                        product.sku,
                        product.barcode,
                        product.referenceCode,
                        product.category,
                        product.unit,
                        product.stockQuantity,
                        product.minimumStock,
                        replenishmentCalculator.suggestedPurchaseQuantity(product),
                        replenishmentCalculator.suggestedPurchaseQuantity(product),
                        status(product.stockQuantity)
                ))
                .toList();
    }

    public ReplenishmentProductPageResponse listCriticalProducts(
            String search,
            String status,
            Integer page,
            Integer size
    ) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();
        return new ReplenishmentProductPageResponse(
                productRepository.listReplenishmentByCompany(companyId, search, status, safePage, safeSize)
                        .stream()
                        .map(this::response)
                        .toList(),
                safePage,
                safeSize,
                productRepository.countReplenishmentByCompany(companyId, search, status)
        );
    }

    @Transactional
    public ReplenishmentEntryResponse registerEntry(ReplenishmentEntryRequest request) {
        return restock(request.productId(), new RestockRequest(request.quantity(), request.reason()));
    }

    @Transactional
    public ReplenishmentEntryResponse restock(UUID productId, RestockRequest request) {
        UUID replenishmentId = UUID.randomUUID();
        StockMovementResponse movement = stockService.entryWithReference(
                productId,
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

    private ReplenishmentProductResponse response(com.stockflow.products.ProductEntity product) {
        return new ReplenishmentProductResponse(
                product.id,
                product.id,
                product.name,
                product.sku,
                product.barcode,
                product.referenceCode,
                product.category,
                product.unit,
                product.stockQuantity,
                product.minimumStock,
                replenishmentCalculator.suggestedPurchaseQuantity(product),
                replenishmentCalculator.suggestedPurchaseQuantity(product),
                status(product.stockQuantity)
        );
    }

    private String status(java.math.BigDecimal stockQuantity) {
        return stockQuantity.compareTo(java.math.BigDecimal.ZERO) <= 0
                ? LowStockStatus.OUT_OF_STOCK.name()
                : LowStockStatus.LOW_STOCK.name();
    }
}
