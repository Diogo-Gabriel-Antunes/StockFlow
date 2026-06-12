package com.stockflow.customerportal;

import com.stockflow.products.ProductEntity;
import java.util.UUID;

public record CustomerPortalProductResponse(
        UUID id,
        String name,
        String description,
        String sku,
        String referenceCode,
        String imageUrl
) {
    public static CustomerPortalProductResponse from(ProductEntity product) {
        return new CustomerPortalProductResponse(
                product.id,
                product.name,
                product.description,
                product.sku,
                product.referenceCode,
                product.imageUrl
        );
    }
}
