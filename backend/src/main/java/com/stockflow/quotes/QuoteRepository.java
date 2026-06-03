package com.stockflow.quotes;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class QuoteRepository implements PanacheRepositoryBase<QuoteEntity, UUID> {

    public List<QuoteEntity> listByCompany(UUID companyId, QuoteStatus status, int page, int size) {
        return find(query(status), Sort.by("createdAt").descending(), parameters(companyId, status))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(UUID companyId, QuoteStatus status) {
        return count(query(status), parameters(companyId, status));
    }

    public Optional<QuoteEntity> findByCompanyAndId(UUID companyId, UUID id) {
        return find("company.id = ?1 and id = ?2", companyId, id).firstResultOptional();
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

    public List<QuoteEntity> listRecentByCompany(UUID companyId, int limit) {
        return find("company.id = ?1", Sort.by("createdAt").descending(), companyId)
                .page(Page.of(0, limit))
                .list();
    }

    private String query(QuoteStatus status) {
        if (status == null) {
            return "company.id = :companyId";
        }
        return "company.id = :companyId and status = :status";
    }

    private Parameters parameters(UUID companyId, QuoteStatus status) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (status != null) {
            parameters.and("status", status);
        }
        return parameters;
    }
}
