package com.stockflow.replenishments;

import com.stockflow.products.ProductEntity;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;

@ApplicationScoped
public class ReplenishmentCalculator {

    public boolean isCritical(ProductEntity product) {
        return product.stockQuantity.compareTo(product.minimumStock) <= 0;
    }

    public BigDecimal suggestedPurchaseQuantity(ProductEntity product) {
        return product.minimumStock.subtract(product.stockQuantity).max(BigDecimal.ZERO);
    }
}
