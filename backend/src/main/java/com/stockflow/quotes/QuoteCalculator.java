package com.stockflow.quotes;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@ApplicationScoped
public class QuoteCalculator {

    public BigDecimal itemTotal(BigDecimal quantity, BigDecimal unitPrice, BigDecimal discount) {
        BigDecimal safeDiscount = money(discount == null ? BigDecimal.ZERO : discount);
        BigDecimal total = money(quantity.multiply(unitPrice)).subtract(safeDiscount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Item discount cannot be greater than item subtotal");
        }
        return money(total);
    }

    public QuoteTotals totals(List<QuoteItemEntity> items, BigDecimal discount, BigDecimal shipping) {
        BigDecimal subtotal = items.stream()
                .map(item -> item.total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal safeDiscount = money(discount == null ? BigDecimal.ZERO : discount);
        BigDecimal safeShipping = money(shipping == null ? BigDecimal.ZERO : shipping);
        BigDecimal total = money(subtotal).subtract(safeDiscount).add(safeShipping);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Quote discount cannot be greater than subtotal plus shipping");
        }
        return new QuoteTotals(money(subtotal), safeDiscount, safeShipping, money(total));
    }

    public BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
