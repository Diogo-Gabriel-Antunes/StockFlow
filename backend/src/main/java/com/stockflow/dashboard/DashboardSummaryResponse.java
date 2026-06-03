package com.stockflow.dashboard;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        long totalQuotesMonth,
        BigDecimal approvedValueMonth,
        BigDecimal openValue,
        BigDecimal approvalRate,
        long lowStockProductCount,
        List<DashboardLowStockProductResponse> lowStockProducts,
        List<DashboardQuoteResponse> recentQuotes,
        List<DashboardCustomerResponse> recentCustomers
) {
}
