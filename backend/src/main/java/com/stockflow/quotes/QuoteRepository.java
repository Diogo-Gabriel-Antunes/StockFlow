package com.stockflow.quotes;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class QuoteRepository implements PanacheRepositoryBase<QuoteEntity, UUID> {

    public List<QuoteEntity> listByCompany(
            UUID companyId,
            String search,
            QuoteStatus status,
            UUID customerId,
            LocalDate dateFrom,
            LocalDate dateTo,
            String sort,
            String direction,
            int page,
            int size
    ) {
        return find(query(search, status, customerId, dateFrom, dateTo), sort(sort, direction), parameters(companyId, search, status, customerId, dateFrom, dateTo))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(UUID companyId, String search, QuoteStatus status, UUID customerId, LocalDate dateFrom, LocalDate dateTo) {
        return count(query(search, status, customerId, dateFrom, dateTo), parameters(companyId, search, status, customerId, dateFrom, dateTo));
    }

    public List<QuoteEntity> listByCompany(UUID companyId, QuoteStatus status, int page, int size) {
        return listByCompany(companyId, null, status, null, null, null, "createdAt", "desc", page, size);
    }

    public long countByCompany(UUID companyId, QuoteStatus status) {
        return countByCompany(companyId, null, status, null, null, null);
    }

    public Optional<QuoteEntity> findByCompanyAndId(UUID companyId, UUID id) {
        return find("company.id = ?1 and id = ?2", companyId, id).firstResultOptional();
    }

    public Optional<QuoteEntity> findByCustomerAndId(UUID customerId, UUID id) {
        return find("customer.id = ?1 and id = ?2", customerId, id).firstResultOptional();
    }

    public List<QuoteEntity> listByCustomerAndStatuses(UUID customerId, Collection<QuoteStatus> statuses, int page, int size) {
        return find(
                "customer.id = ?1 and status in ?2",
                Sort.by("createdAt").descending(),
                customerId,
                statuses
        )
                .page(Page.of(page, size))
                .list();
    }

    public long countByCustomerAndStatuses(UUID customerId, Collection<QuoteStatus> statuses) {
        return count("customer.id = ?1 and status in ?2", customerId, statuses);
    }

    public long countByCompanyCreatedBetween(UUID companyId, OffsetDateTime start, OffsetDateTime end) {
        return count("company.id = ?1 and createdAt >= ?2 and createdAt < ?3", companyId, start, end);
    }

    public long countByCompanyStatusCreatedBetween(
            UUID companyId,
            QuoteStatus status,
            OffsetDateTime start,
            OffsetDateTime end
    ) {
        return count(
                "company.id = ?1 and status = ?2 and createdAt >= ?3 and createdAt < ?4",
                companyId,
                status,
                start,
                end
        );
    }

    public BigDecimal sumTotalByCompanyStatusCreatedBetween(
            UUID companyId,
            QuoteStatus status,
            OffsetDateTime start,
            OffsetDateTime end
    ) {
        BigDecimal total = getEntityManager()
                .createQuery("""
                        select coalesce(sum(q.total), 0)
                        from QuoteEntity q
                        where q.company.id = :companyId
                        and q.status = :status
                        and q.createdAt >= :start
                        and q.createdAt < :end
                        """, BigDecimal.class)
                .setParameter("companyId", companyId)
                .setParameter("status", status)
                .setParameter("start", start)
                .setParameter("end", end)
                .getSingleResult();
        return total == null ? BigDecimal.ZERO : total;
    }

    public BigDecimal sumTotalByCompanyStatuses(UUID companyId, Collection<QuoteStatus> statuses) {
        BigDecimal total = getEntityManager()
                .createQuery("""
                        select coalesce(sum(q.total), 0)
                        from QuoteEntity q
                        where q.company.id = :companyId
                        and q.status in :statuses
                        """, BigDecimal.class)
                .setParameter("companyId", companyId)
                .setParameter("statuses", statuses)
                .getSingleResult();
        return total == null ? BigDecimal.ZERO : total;
    }

    public BigDecimal sumTotalByCompanyStatusesCreatedBetween(
            UUID companyId,
            Collection<QuoteStatus> statuses,
            OffsetDateTime start,
            OffsetDateTime end
    ) {
        BigDecimal total = getEntityManager()
                .createQuery("""
                        select coalesce(sum(q.total), 0)
                        from QuoteEntity q
                        where q.company.id = :companyId
                        and q.status in :statuses
                        and q.createdAt >= :start
                        and q.createdAt < :end
                        """, BigDecimal.class)
                .setParameter("companyId", companyId)
                .setParameter("statuses", statuses)
                .setParameter("start", start)
                .setParameter("end", end)
                .getSingleResult();
        return total == null ? BigDecimal.ZERO : total;
    }

    public List<QuoteEntity> listRecentByCompany(UUID companyId, int limit) {
        return find("company.id = ?1", Sort.by("createdAt").descending(), companyId)
                .page(Page.of(0, limit))
                .list();
    }

    private String query(String search, QuoteStatus status, UUID customerId, LocalDate dateFrom, LocalDate dateTo) {
        StringBuilder query = new StringBuilder("company.id = :companyId");
        if (status != null) {
            query.append(" and status = :status");
        }
        if (customerId != null) {
            query.append(" and customer.id = :customerId");
        }
        if (dateFrom != null) {
            query.append(" and createdAt >= :dateFrom");
        }
        if (dateTo != null) {
            query.append(" and createdAt < :dateTo");
        }
        if (search != null && !search.isBlank()) {
            query.append("""
                 and (
                    lower(code) like :search
                    or lower(customer.name) like :search
                    or lower(coalesce(customer.document, '')) like :search
                    or lower(coalesce(notes, '')) like :search
                )
                """);
        }
        return query.toString();
    }

    private Parameters parameters(UUID companyId, String search, QuoteStatus status, UUID customerId, LocalDate dateFrom, LocalDate dateTo) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (status != null) {
            parameters.and("status", status);
        }
        if (customerId != null) {
            parameters.and("customerId", customerId);
        }
        if (dateFrom != null) {
            parameters.and("dateFrom", dateFrom.atStartOfDay().atOffset(ZoneOffset.UTC));
        }
        if (dateTo != null) {
            parameters.and("dateTo", dateTo.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC));
        }
        if (search != null && !search.isBlank()) {
            parameters.and("search", "%" + search.trim().toLowerCase() + "%");
        }
        return parameters;
    }

    private Sort sort(String sort, String direction) {
        String field = switch (sort == null ? "" : sort) {
            case "total" -> "total";
            case "status" -> "status";
            case "validUntil" -> "validUntil";
            default -> "createdAt";
        };
        Sort.Direction safeDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.Ascending : Sort.Direction.Descending;
        Sort safeSort = Sort.by(field, safeDirection);
        if (!"createdAt".equals(field)) {
            safeSort = safeSort.and("createdAt", Sort.Direction.Descending);
        }
        return safeSort;
    }
}
