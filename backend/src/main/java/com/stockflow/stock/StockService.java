package com.stockflow.stock;

import com.stockflow.products.ProductEntity;
import com.stockflow.products.ProductRepository;
import com.stockflow.shared.security.AuthenticatedTenant;
import com.stockflow.users.UserEntity;
import com.stockflow.users.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class StockService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    StockMovementRepository stockMovementRepository;

    @Inject
    ProductRepository productRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    public StockMovementPageResponse listMovements(UUID productId, Integer page, Integer size) {
        return listMovements(null, productId, null, null, null, null, null, page, size);
    }

    public StockMovementPageResponse listMovements(
            String search,
            UUID productId,
            StockMovementType type,
            LocalDate dateFrom,
            LocalDate dateTo,
            String sort,
            String direction,
            Integer page,
            Integer size
    ) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();

        return new StockMovementPageResponse(
                stockMovementRepository.listByCompany(companyId, search, productId, type, dateFrom, dateTo, sort, direction, safePage, safeSize)
                        .stream()
                        .map(StockMovementResponse::from)
                        .toList(),
                safePage,
                safeSize,
                stockMovementRepository.countByCompany(companyId, search, productId, type, dateFrom, dateTo)
        );
    }

    public StockMovementPageResponse listMovementsByProduct(UUID productId, Integer page, Integer size) {
        findProduct(productId);
        return listMovements(productId, page, size);
    }

    public List<LowStockProductResponse> listLowStock() {
        UUID companyId = authenticatedTenant.companyId();
        return productRepository.listLowStockByCompany(companyId)
                .stream()
                .map(LowStockProductResponse::from)
                .toList();
    }

    @Transactional
    public StockMovementResponse entry(StockMovementRequest request) {
        ProductEntity product = findProduct(request.productId());
        return StockMovementResponse.from(applyMovement(product, StockMovementType.IN, request.quantity(), request.reason(), null, null));
    }

    public StockMovementResponse entryWithReference(UUID productId, BigDecimal quantity, String reason, String referenceType, UUID referenceId) {
        ProductEntity product = findProduct(productId);
        return StockMovementResponse.from(applyMovement(product, StockMovementType.IN, quantity, reason, referenceType, referenceId));
    }

    @Transactional
    public StockMovementResponse output(StockMovementRequest request) {
        ProductEntity product = findProduct(request.productId());
        BigDecimal previousQuantity = product.stockQuantity;
        BigDecimal newQuantity = previousQuantity.subtract(request.quantity());
        if (newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Estoque insuficiente para realizar a saída.");
        }
        return StockMovementResponse.from(saveMovement(product, StockMovementType.OUT, request.quantity(), previousQuantity, newQuantity, request.reason(), null, null));
    }

    @Transactional
    public StockMovementResponse adjustment(StockAdjustmentRequest request) {
        ProductEntity product = findProduct(request.productId());
        BigDecimal previousQuantity = product.stockQuantity;
        BigDecimal quantity = request.newQuantity().subtract(previousQuantity).abs();
        return StockMovementResponse.from(saveMovement(
                product,
                StockMovementType.ADJUSTMENT,
                quantity,
                previousQuantity,
                request.newQuantity(),
                request.reason(),
                null,
                null
        ));
    }

    private StockMovementEntity applyMovement(ProductEntity product, StockMovementType type, BigDecimal quantity, String reason, String referenceType, UUID referenceId) {
        BigDecimal previousQuantity = product.stockQuantity;
        BigDecimal newQuantity = previousQuantity.add(quantity);
        return saveMovement(product, type, quantity, previousQuantity, newQuantity, reason, referenceType, referenceId);
    }

    private StockMovementEntity saveMovement(
            ProductEntity product,
            StockMovementType type,
            BigDecimal quantity,
            BigDecimal previousQuantity,
            BigDecimal newQuantity,
            String reason,
            String referenceType,
            UUID referenceId
    ) {
        UserEntity user = userRepository.findByIdOptional(authenticatedTenant.userId())
                .orElseThrow(NotFoundException::new);

        product.stockQuantity = newQuantity;

        StockMovementEntity movement = new StockMovementEntity();
        movement.company = product.company;
        movement.product = product;
        movement.type = type;
        movement.quantity = quantity;
        movement.previousQuantity = previousQuantity;
        movement.newQuantity = newQuantity;
        movement.reason = trimToNull(reason);
        movement.referenceType = trimToNull(referenceType);
        movement.referenceId = referenceId;
        movement.createdBy = user;
        stockMovementRepository.persist(movement);
        return movement;
    }

    private ProductEntity findProduct(UUID productId) {
        return productRepository.findActiveByCompanyAndId(authenticatedTenant.companyId(), productId)
                .orElseThrow(NotFoundException::new);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
