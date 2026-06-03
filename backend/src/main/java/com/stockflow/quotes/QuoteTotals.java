package com.stockflow.quotes;

import java.math.BigDecimal;

public record QuoteTotals(
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal shipping,
        BigDecimal total
) {
}
