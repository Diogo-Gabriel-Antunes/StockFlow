package com.stockflow.quotes;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import jakarta.ws.rs.BadRequestException;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class QuoteCalculatorTest {

    private final QuoteCalculator calculator = new QuoteCalculator();

    @Test
    void calculatesItemAndQuoteTotals() {
        QuoteItemEntity first = new QuoteItemEntity();
        first.total = calculator.itemTotal(new BigDecimal("2"), new BigDecimal("10.00"), BigDecimal.ONE);
        QuoteItemEntity second = new QuoteItemEntity();
        second.total = calculator.itemTotal(new BigDecimal("1"), new BigDecimal("5.50"), BigDecimal.ZERO);

        QuoteTotals totals = calculator.totals(List.of(first, second), new BigDecimal("2.50"), new BigDecimal("3.00"));

        assertEquals(new BigDecimal("24.50"), totals.subtotal());
        assertEquals(new BigDecimal("2.50"), totals.discount());
        assertEquals(new BigDecimal("3.00"), totals.shipping());
        assertEquals(new BigDecimal("25.00"), totals.total());
    }

    @Test
    void rejectsDiscountGreaterThanItemSubtotal() {
        assertThrows(BadRequestException.class, () ->
                calculator.itemTotal(new BigDecimal("1"), new BigDecimal("5.00"), new BigDecimal("6.00"))
        );
    }
}
