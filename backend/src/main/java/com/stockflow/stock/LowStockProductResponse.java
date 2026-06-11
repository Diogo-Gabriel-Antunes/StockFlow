package com.stockflow.stock;

import com.stockflow.products.ProductEntity;
import java.math.BigDecimal;
import java.util.UUID;

public record LowStockProductResponse(
        UUID id,
        String name,
        String sku,
        String barcode,
        String referenceCode,
        String category,
        BigDecimal salePrice,
        BigDecimal stockQuantity,
        BigDecimal minimumStock,
        String unit,
        LowStockStatus stockStatus,
        BigDecimal suggestedPurchaseQuantity
) {
    public static LowStockProductResponse from(ProductEntity product) {
        return new LowStockProductResponse(
                product.id,
                product.name,
                product.sku,
                product.barcode,
                product.referenceCode,
                product.category,
                product.salePrice,
                product.stockQuantity,
                product.minimumStock,
                product.unit,
                status(product.stockQuantity),
                product.minimumStock.subtract(product.stockQuantity).max(BigDecimal.ZERO)
        );
    }

    private static LowStockStatus status(BigDecimal stockQuantity) {
        if (stockQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            return LowStockStatus.OUT_OF_STOCK;
        }
        return LowStockStatus.LOW_STOCK;
    }
}
