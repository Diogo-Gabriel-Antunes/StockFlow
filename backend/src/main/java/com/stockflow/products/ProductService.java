package com.stockflow.products;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.companies.CompanyRepository;
import com.stockflow.shared.security.AuthenticatedTenant;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.util.UUID;

@ApplicationScoped
public class ProductService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    ProductRepository productRepository;

    @Inject
    CompanyRepository companyRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    public ProductPageResponse list(String search, Integer page, Integer size) {
        return list(search, null, null, null, null, page, size);
    }

    public ProductPageResponse list(
            String search,
            Boolean active,
            Boolean lowStock,
            String sort,
            String direction,
            Integer page,
            Integer size
    ) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();

        return new ProductPageResponse(
                productRepository.listByCompany(companyId, search, active, lowStock, sort, direction, safePage, safeSize)
                        .stream()
                        .map(ProductResponse::from)
                        .toList(),
                safePage,
                safeSize,
                productRepository.countByCompany(companyId, search, active, lowStock)
        );
    }

    public ProductResponse get(UUID id) {
        return ProductResponse.from(findCurrentCompanyProduct(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        CompanyEntity company = companyRepository.findByIdOptional(authenticatedTenant.companyId())
                .orElseThrow(NotFoundException::new);

        ProductEntity product = new ProductEntity();
        product.company = company;
        applyRequest(product, request);
        product.active = true;
        productRepository.persist(product);
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {
        ProductEntity product = findCurrentCompanyProduct(id);
        applyRequest(product, request);
        return ProductResponse.from(product);
    }

    @Transactional
    public void delete(UUID id) {
        ProductEntity product = findCurrentCompanyProduct(id);
        product.active = false;
    }

    private ProductEntity findCurrentCompanyProduct(UUID id) {
        return productRepository.findActiveByCompanyAndId(authenticatedTenant.companyId(), id)
                .orElseThrow(NotFoundException::new);
    }

    private void applyRequest(ProductEntity product, ProductRequest request) {
        product.name = request.name().trim();
        product.sku = trimToNull(request.sku());
        product.category = trimToNull(request.category());
        product.barcode = trimToNull(request.barcode());
        product.referenceCode = trimToNull(request.referenceCode());
        product.costPrice = request.costPrice();
        product.salePrice = request.salePrice();
        product.unit = request.unit().trim();
        product.stockQuantity = request.stockQuantity();
        product.minimumStock = request.minimumStock();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
