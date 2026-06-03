package com.stockflow.products;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ProductRepository implements PanacheRepositoryBase<ProductEntity, UUID> {

    public List<ProductEntity> listActiveByCompany(UUID companyId, String search, int page, int size) {
        return find(query(search), sort(), parameters(companyId, search))
                .page(Page.of(page, size))
                .list();
    }

    public long countActiveByCompany(UUID companyId, String search) {
        return count(query(search), parameters(companyId, search));
    }

    public Optional<ProductEntity> findActiveByCompanyAndId(UUID companyId, UUID id) {
        return find("company.id = ?1 and id = ?2 and active = true", companyId, id).firstResultOptional();
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
                    or lower(coalesce(sku, '')) like :search
                    or lower(coalesce(category, '')) like :search
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

    private Sort sort() {
        return Sort.by("name").ascending().and("createdAt").descending();
    }
}
