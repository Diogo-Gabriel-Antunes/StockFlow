package com.stockflow.customers;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class CustomerRepository implements PanacheRepositoryBase<CustomerEntity, UUID> {

    public List<CustomerEntity> listActiveByCompany(
            UUID companyId,
            String search,
            String sort,
            String direction,
            int page,
            int size
    ) {
        return find(query(search), sort(sort, direction), parameters(companyId, search))
                .page(Page.of(page, size))
                .list();
    }

    public List<CustomerEntity> listActiveByCompany(UUID companyId, String search, int page, int size) {
        return listActiveByCompany(companyId, search, "name", "asc", page, size);
    }

    public long countActiveByCompany(UUID companyId, String search) {
        return count(query(search), parameters(companyId, search));
    }

    public long countActiveByCompanyCreatedBetween(UUID companyId, OffsetDateTime start, OffsetDateTime end) {
        return count(
                "company.id = ?1 and active = true and createdAt >= ?2 and createdAt < ?3",
                companyId,
                start,
                end
        );
    }

    public Optional<CustomerEntity> findActiveByCompanyAndId(UUID companyId, UUID id) {
        return find("company.id = ?1 and id = ?2 and active = true", companyId, id).firstResultOptional();
    }

    public Optional<CustomerEntity> findActiveByPortalToken(String token) {
        return find("portalToken = ?1 and portalEnabled = true and active = true", token).firstResultOptional();
    }

    public List<CustomerEntity> listRecentActiveByCompany(UUID companyId, int limit) {
        return find("company.id = ?1 and active = true", Sort.by("createdAt").descending(), companyId)
                .page(Page.of(0, limit))
                .list();
    }

    private String query(String search) {
        if (search == null || search.isBlank()) {
            return "company.id = :companyId and active = true";
        }
        return """
                company.id = :companyId
                and active = true
                and (
                    lower(name) like :search
                    or lower(coalesce(document, '')) like :search
                    or lower(coalesce(email, '')) like :search
                    or lower(coalesce(phone, '')) like :search
                    or lower(coalesce(whatsapp, '')) like :search
                    or lower(coalesce(city, '')) like :search
                )
                """;
    }

    private Parameters parameters(UUID companyId, String search) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (search != null && !search.isBlank()) {
            parameters.and("search", "%" + search.trim().toLowerCase() + "%");
        }
        return parameters;
    }

    private Sort sort(String sort, String direction) {
        String field = switch (sort == null ? "" : sort) {
            case "createdAt" -> "createdAt";
            case "city" -> "city";
            default -> "name";
        };
        Sort.Direction safeDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.Descending : Sort.Direction.Ascending;
        Sort safeSort = Sort.by(field, safeDirection);
        if (!"name".equals(field)) {
            safeSort = safeSort.and("name", Sort.Direction.Ascending);
        }
        return safeSort;
    }
}
