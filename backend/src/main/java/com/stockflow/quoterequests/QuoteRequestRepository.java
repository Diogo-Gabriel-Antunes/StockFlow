package com.stockflow.quoterequests;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class QuoteRequestRepository implements PanacheRepositoryBase<QuoteRequestEntity, UUID> {

    public Optional<QuoteRequestEntity> findByCompanyAndId(UUID companyId, UUID id) {
        return find("company.id = ?1 and id = ?2", companyId, id).firstResultOptional();
    }

    public Optional<QuoteRequestEntity> findByCustomerAndId(UUID customerId, UUID id) {
        return find("customer.id = ?1 and id = ?2", customerId, id).firstResultOptional();
    }

    public List<QuoteRequestEntity> listByCustomer(UUID customerId) {
        return find("customer.id = ?1", Sort.by("createdAt").descending(), customerId).list();
    }

    public long countByCustomer(UUID customerId) {
        return count("customer.id = ?1", customerId);
    }

    public List<QuoteRequestEntity> listByCompany(
            UUID companyId,
            QuoteRequestStatus status,
            String search,
            int page,
            int size
    ) {
        return find(query(status, search), Sort.by("createdAt").descending(), parameters(companyId, status, search))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(UUID companyId, QuoteRequestStatus status, String search) {
        return count(query(status, search), parameters(companyId, status, search));
    }

    private String query(QuoteRequestStatus status, String search) {
        StringBuilder query = new StringBuilder("company.id = :companyId");
        if (status != null) {
            query.append(" and status = :status");
        }
        if (search != null && !search.isBlank()) {
            query.append("""
                     and (
                        lower(customer.name) like :search
                        or lower(title) like :search
                        or lower(coalesce(description, '')) like :search
                        or id in (
                            select item.quoteRequest.id from QuoteRequestItemEntity item
                            where lower(coalesce(item.description, '')) like :search
                               or lower(coalesce(item.productNameSnapshot, '')) like :search
                               or lower(coalesce(item.productSkuSnapshot, '')) like :search
                               or lower(coalesce(item.productReferenceSnapshot, '')) like :search
                        )
                    )
                    """);
        }
        return query.toString();
    }

    private Parameters parameters(UUID companyId, QuoteRequestStatus status, String search) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (status != null) {
            parameters.and("status", status);
        }
        if (search != null && !search.isBlank()) {
            parameters.and("search", "%" + search.trim().toLowerCase() + "%");
        }
        return parameters;
    }
}
