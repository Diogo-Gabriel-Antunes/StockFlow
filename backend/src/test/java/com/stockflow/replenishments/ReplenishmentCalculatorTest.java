package com.stockflow.replenishments;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.stockflow.products.ProductEntity;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ReplenishmentCalculatorTest {

    private final ReplenishmentCalculator calculator = new ReplenishmentCalculator();

    @Test
    void identifiesCriticalProductsAndSuggestedPurchaseQuantity() {
        ProductEntity critical = new ProductEntity();
        critical.stockQuantity = new BigDecimal("2.000");
        critical.minimumStock = new BigDecimal("5.000");

        ProductEntity equalToMinimum = new ProductEntity();
        equalToMinimum.stockQuantity = new BigDecimal("5.000");
        equalToMinimum.minimumStock = new BigDecimal("5.000");

        ProductEntity healthy = new ProductEntity();
        healthy.stockQuantity = new BigDecimal("8.000");
        healthy.minimumStock = new BigDecimal("5.000");

        assertTrue(calculator.isCritical(critical));
        assertTrue(calculator.isCritical(equalToMinimum));
        assertFalse(calculator.isCritical(healthy));
        assertEquals(new BigDecimal("3.000"), calculator.suggestedPurchaseQuantity(critical));
        assertEquals(0, BigDecimal.ZERO.compareTo(calculator.suggestedPurchaseQuantity(equalToMinimum)));
    }
}
