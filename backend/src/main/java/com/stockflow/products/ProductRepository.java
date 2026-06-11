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

    public List<ProductEntity> listByCompany(
            UUID companyId,
            String search,
            Boolean active,
            Boolean lowStock,
            String sort,
            String direction,
            int page,
            int size
    ) {
        return find(query(search, active, lowStock), sort(sort, direction), parameters(companyId, search, active))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(UUID companyId, String search, Boolean active, Boolean lowStock) {
        return count(query(search, active, lowStock), parameters(companyId, search, active));
    }

    public List<ProductEntity> listActiveByCompany(UUID companyId, String search, int page, int size) {
        return listByCompany(companyId, search, true, null, "name", "asc", page, size);
    }

    public long countActiveByCompany(UUID companyId, String search) {
        return countByCompany(companyId, search, true, null);
    }

    public Optional<ProductEntity> findActiveByCompanyAndId(UUID companyId, UUID id) {
        return find("company.id = ?1 and id = ?2 and active = true", companyId, id).firstResultOptional();
    }

    public long countLowStockByCompany(UUID companyId) {
        return count("company.id = ?1 and active = true and stockQuantity <= minimumStock", companyId);
    }

    public long countOutOfStockByCompany(UUID companyId) {
        return count("company.id = ?1 and active = true and stockQuantity <= 0", companyId);
    }

    public List<ProductEntity> listLowStockByCompany(UUID companyId, int limit) {
        return find(
                "company.id = ?1 and active = true and stockQuantity <= minimumStock",
                Sort.by("stockQuantity").ascending().and("name").ascending(),
                companyId
        )
                .page(Page.of(0, limit))
                .list();
    }

    public List<ProductEntity> listLowStockByCompany(UUID companyId) {
        return find(
                "company.id = ?1 and active = true and stockQuantity <= minimumStock",
                Sort.by("stockQuantity").ascending().and("name").ascending(),
                companyId
        ).list();
    }

    public List<ProductEntity> listReplenishmentByCompany(
            UUID companyId,
            String search,
            String status,
            int page,
            int size
    ) {
        return find(replenishmentQuery(search, status), replenishmentSort(), replenishmentParameters(companyId, search))
                .page(Page.of(page, size))
                .list();
    }

    public long countReplenishmentByCompany(UUID companyId, String search, String status) {
        return count(replenishmentQuery(search, status), replenishmentParameters(companyId, search));
    }

    private String query(String search, Boolean active, Boolean lowStock) {
        StringBuilder query = new StringBuilder("company.id = :companyId");
        if (active != null) {
            query.append(" and active = :active");
        }
        if (Boolean.TRUE.equals(lowStock)) {
            query.append(" and stockQuantity <= minimumStock");
        }
        if (search != null && !search.isBlank()) {
            query.append("""
                 and (
                    lower(name) like :search
                    or lower(coalesce(sku, '')) like :search
                    or lower(coalesce(category, '')) like :search
                    or lower(coalesce(barcode, '')) like :search
                    or lower(coalesce(referenceCode, '')) like :search
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
            case "stockQuantity" -> "stockQuantity";
            case "minimumStock" -> "minimumStock";
            case "salePrice" -> "salePrice";
            default -> "name";
        };
        Sort.Direction safeDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.Descending : Sort.Direction.Ascending;
        Sort safeSort = Sort.by(field, safeDirection);
        if (!"name".equals(field)) {
            safeSort = safeSort.and("name", Sort.Direction.Ascending);
        }
        return safeSort;
    }

    private String replenishmentQuery(String search, String status) {
        StringBuilder query = new StringBuilder("company.id = :companyId and active = true and stockQuantity <= minimumStock");
        if ("OUT_OF_STOCK".equals(status)) {
            query.append(" and stockQuantity <= 0");
        } else if ("LOW_STOCK".equals(status)) {
            query.append(" and stockQuantity > 0");
        }
        if (search != null && !search.isBlank()) {
            query.append("""
                 and (
                    lower(name) like :search
                    or lower(coalesce(sku, '')) like :search
                    or lower(coalesce(category, '')) like :search
                    or lower(coalesce(barcode, '')) like :search
                    or lower(coalesce(referenceCode, '')) like :search
                )
                """);
        }
        return query.toString();
    }

    private Parameters replenishmentParameters(UUID companyId, String search) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (search != null && !search.isBlank()) {
            parameters.and("search", "%" + search.trim().toLowerCase() + "%");
        }
        return parameters;
    }

    private Sort replenishmentSort() {
        return Sort.by("stockQuantity").ascending().and("name").ascending();
    }
}
