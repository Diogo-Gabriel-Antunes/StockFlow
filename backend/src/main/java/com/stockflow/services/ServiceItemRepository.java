package com.stockflow.services;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ServiceItemRepository implements PanacheRepositoryBase<ServiceItemEntity, UUID> {

    public List<ServiceItemEntity> listByCompany(
            UUID companyId,
            String search,
            Boolean active,
            String sort,
            String direction,
            int page,
            int size
    ) {
        return find(query(search, active), sort(sort, direction), parameters(companyId, search, active))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(UUID companyId, String search, Boolean active) {
        return count(query(search, active), parameters(companyId, search, active));
    }

    public List<ServiceItemEntity> listActiveByCompany(UUID companyId, String search, int page, int size) {
        return listByCompany(companyId, search, true, "name", "asc", page, size);
    }

    public long countActiveByCompany(UUID companyId, String search) {
        return countByCompany(companyId, search, true);
    }

    public Optional<ServiceItemEntity> findActiveByCompanyAndId(UUID companyId, UUID id) {
        return find("company.id = ?1 and id = ?2 and active = true", companyId, id).firstResultOptional();
    }

    private String query(String search, Boolean active) {
        StringBuilder query = new StringBuilder("company.id = :companyId");
        if (active != null) {
            query.append(" and active = :active");
        }
        if (search != null && !search.isBlank()) {
            query.append("""
                 and (
                    lower(name) like :search
                    or lower(coalesce(description, '')) like :search
                )
                """);
        }
        return query.toString();
    }

    private Parameters parameters(UUID companyId, String search, Boolean active) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (active != null) {
            parameters.and("active", active);
        }
        if (search != null && !search.isBlank()) {
            parameters.and("search", "%" + search.trim().toLowerCase() + "%");
        }
        return parameters;
    }

    private Sort sort(String sort, String direction) {
        String field = switch (sort == null ? "" : sort) {
            case "createdAt" -> "createdAt";
            case "defaultPrice" -> "defaultPrice";
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
