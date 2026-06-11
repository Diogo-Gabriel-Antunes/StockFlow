package com.stockflow.dashboard;

import com.stockflow.customers.CustomerRepository;
import com.stockflow.products.ProductRepository;
import com.stockflow.quotes.QuoteRepository;
import com.stockflow.quotes.QuoteStatus;
import com.stockflow.shared.security.AuthenticatedTenant;
import com.stockflow.stock.StockMovementRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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

    @Inject
    StockMovementRepository stockMovementRepository;

    public DashboardSummaryResponse summary(String period, LocalDate dateFrom, LocalDate dateTo) {
        UUID companyId = authenticatedTenant.companyId();
        PeriodRange range = periodRange(period, dateFrom, dateTo);

        long totalQuotes = quoteRepository.countByCompanyCreatedBetween(companyId, range.start(), range.endExclusive());
        long approvedByCustomer = quoteRepository.countByCompanyStatusCreatedBetween(
                companyId,
                QuoteStatus.CUSTOMER_APPROVED,
                range.start(),
                range.endExclusive()
        );
        long completed = quoteRepository.countByCompanyStatusCreatedBetween(
                companyId,
                QuoteStatus.COMPLETED,
                range.start(),
                range.endExclusive()
        );
        long rejected = quoteRepository.countByCompanyStatusCreatedBetween(
                companyId,
                QuoteStatus.REJECTED,
                range.start(),
                range.endExclusive()
        );
        long cancelled = quoteRepository.countByCompanyStatusCreatedBetween(
                companyId,
                QuoteStatus.CANCELLED,
                range.start(),
                range.endExclusive()
        );
        List<QuoteStatus> openStatuses = List.of(QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.CUSTOMER_APPROVED);
        long open = totalQuotes - completed - rejected - cancelled;
        BigDecimal approvedAmount = quoteRepository.sumTotalByCompanyStatusCreatedBetween(
                companyId,
                QuoteStatus.COMPLETED,
                range.start(),
                range.endExclusive()
        );
        BigDecimal openAmount = quoteRepository.sumTotalByCompanyStatusesCreatedBetween(
                companyId,
                openStatuses,
                range.start(),
                range.endExclusive()
        );

        return new DashboardSummaryResponse(
                new DashboardSummaryResponse.PeriodResponse(range.dateFrom(), range.dateTo()),
                new DashboardSummaryResponse.QuoteMetricsResponse(
                        totalQuotes,
                        approvedByCustomer,
                        completed,
                        rejected,
                        cancelled,
                        open,
                        approvedAmount,
                        openAmount,
                        approvalRate(totalQuotes, completed)
                ),
                new DashboardSummaryResponse.StockMetricsResponse(
                        productRepository.countLowStockByCompany(companyId),
                        productRepository.countOutOfStockByCompany(companyId)
                ),
                new DashboardSummaryResponse.CustomerMetricsResponse(
                        customerRepository.countActiveByCompany(companyId, null),
                        customerRepository.countActiveByCompanyCreatedBetween(companyId, range.start(), range.endExclusive())
                ),
                quoteRepository.listRecentByCompany(companyId, RECENT_LIMIT)
                        .stream()
                        .map(DashboardQuoteResponse::from)
                        .toList(),
                customerRepository.listRecentActiveByCompany(companyId, RECENT_LIMIT)
                        .stream()
                        .map(DashboardCustomerResponse::from)
                        .toList(),
                stockMovementRepository.listRecentByCompany(companyId, RECENT_LIMIT)
                        .stream()
                        .map(DashboardStockMovementResponse::from)
                        .toList(),
                productRepository.listLowStockByCompany(companyId, RECENT_LIMIT)
                        .stream()
                        .map(DashboardCriticalProductResponse::from)
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

    PeriodRange periodRange(String period, LocalDate dateFrom, LocalDate dateTo) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        String normalized = period == null || period.isBlank() ? "currentMonth" : period;
        LocalDate startDate;
        LocalDate endDate;

        switch (normalized) {
            case "today" -> {
                startDate = today;
                endDate = today;
            }
            case "last7days" -> {
                startDate = today.minusDays(6);
                endDate = today;
            }
            case "previousMonth" -> {
                LocalDate firstDayCurrentMonth = today.with(TemporalAdjusters.firstDayOfMonth());
                startDate = firstDayCurrentMonth.minusMonths(1);
                endDate = firstDayCurrentMonth.minusDays(1);
            }
            case "custom" -> {
                if (dateFrom == null || dateTo == null) {
                    throw new BadRequestException("dateFrom e dateTo são obrigatórios para período personalizado.");
                }
                if (dateFrom.isAfter(dateTo)) {
                    throw new BadRequestException("dateFrom não pode ser maior que dateTo.");
                }
                startDate = dateFrom;
                endDate = dateTo;
            }
            case "currentMonth" -> {
                startDate = today.with(TemporalAdjusters.firstDayOfMonth());
                endDate = today;
            }
            default -> throw new BadRequestException("Período inválido.");
        }

        return new PeriodRange(
                startDate,
                endDate,
                startDate.atStartOfDay().atOffset(ZoneOffset.UTC),
                endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)
        );
    }

    record PeriodRange(
            LocalDate dateFrom,
            LocalDate dateTo,
            OffsetDateTime start,
            OffsetDateTime endExclusive
    ) {
    }
}
