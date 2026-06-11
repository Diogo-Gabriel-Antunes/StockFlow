package com.stockflow.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DashboardSummaryResponse(
        PeriodResponse period,
        QuoteMetricsResponse quotes,
        StockMetricsResponse stock,
        CustomerMetricsResponse customers,
        List<DashboardQuoteResponse> recentQuotes,
        List<DashboardCustomerResponse> recentCustomers,
        List<DashboardStockMovementResponse> recentStockMovements,
        List<DashboardCriticalProductResponse> criticalProducts
) {
    public record PeriodResponse(LocalDate dateFrom, LocalDate dateTo) {
    }

    public record QuoteMetricsResponse(
            long total,
            long approvedByCustomer,
            long completed,
            long rejected,
            long cancelled,
            long open,
            BigDecimal approvedAmount,
            BigDecimal openAmount,
            BigDecimal approvalRate
    ) {
    }

    public record StockMetricsResponse(long lowStockCount, long outOfStockCount) {
    }

    public record CustomerMetricsResponse(long total, long createdInPeriod) {
    }
}
