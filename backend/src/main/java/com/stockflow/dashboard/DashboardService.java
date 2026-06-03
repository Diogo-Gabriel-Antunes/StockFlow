package com.stockflow.dashboard;

import com.stockflow.customers.CustomerRepository;
import com.stockflow.products.ProductRepository;
import com.stockflow.quotes.QuoteRepository;
import com.stockflow.quotes.QuoteStatus;
import com.stockflow.shared.security.AuthenticatedTenant;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class DashboardService {

    private static final int RECENT_LIMIT = 5;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    @Inject
    QuoteRepository quoteRepository;

    @Inject
    ProductRepository productRepository;

    @Inject
    CustomerRepository customerRepository;

    public DashboardSummaryResponse summary() {
        UUID companyId = authenticatedTenant.companyId();
        OffsetDateTime startOfMonth = OffsetDateTime.now(ZoneOffset.UTC)
                .with(TemporalAdjusters.firstDayOfMonth())
                .toLocalDate()
                .atStartOfDay()
                .atOffset(ZoneOffset.UTC);
        OffsetDateTime startOfNextMonth = startOfMonth.plusMonths(1);

        long totalQuotesMonth = quoteRepository.countByCompanyCreatedBetween(companyId, startOfMonth, startOfNextMonth);
        long approvedQuotesMonth = quoteRepository.countByCompanyStatusCreatedBetween(
                companyId,
                QuoteStatus.APPROVED,
                startOfMonth,
                startOfNextMonth
        );
        BigDecimal approvedValueMonth = quoteRepository.sumTotalByCompanyStatusCreatedBetween(
                companyId,
                QuoteStatus.APPROVED,
                startOfMonth,
                startOfNextMonth
        );
        BigDecimal openValue = quoteRepository.sumTotalByCompanyStatuses(
                companyId,
                List.of(QuoteStatus.DRAFT, QuoteStatus.SENT)
        );

        return new DashboardSummaryResponse(
                totalQuotesMonth,
                approvedValueMonth,
                openValue,
                approvalRate(totalQuotesMonth, approvedQuotesMonth),
                productRepository.countLowStockByCompany(companyId),
                productRepository.listLowStockByCompany(companyId, RECENT_LIMIT)
                        .stream()
                        .map(DashboardLowStockProductResponse::from)
                        .toList(),
                quoteRepository.listRecentByCompany(companyId, RECENT_LIMIT)
                        .stream()
                        .map(DashboardQuoteResponse::from)
                        .toList(),
                customerRepository.listRecentActiveByCompany(companyId, RECENT_LIMIT)
                        .stream()
                        .map(DashboardCustomerResponse::from)
                        .toList()
        );
    }

    BigDecimal approvalRate(long totalQuotesMonth, long approvedQuotesMonth) {
        if (totalQuotesMonth == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(approvedQuotesMonth)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalQuotesMonth), 2, RoundingMode.HALF_UP);
    }
}
