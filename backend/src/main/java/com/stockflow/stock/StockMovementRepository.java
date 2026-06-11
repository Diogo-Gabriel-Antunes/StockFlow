package com.stockflow.stock;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class StockMovementRepository implements PanacheRepositoryBase<StockMovementEntity, UUID> {

    public List<StockMovementEntity> listByCompany(
            UUID companyId,
            String search,
            UUID productId,
            StockMovementType type,
            LocalDate dateFrom,
            LocalDate dateTo,
            String sort,
            String direction,
            int page,
            int size
    ) {
        return find(query(search, productId, type, dateFrom, dateTo), sort(sort, direction), parameters(companyId, search, productId, type, dateFrom, dateTo))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(UUID companyId, String search, UUID productId, StockMovementType type, LocalDate dateFrom, LocalDate dateTo) {
        return count(query(search, productId, type, dateFrom, dateTo), parameters(companyId, search, productId, type, dateFrom, dateTo));
    }

    public List<StockMovementEntity> listByCompany(UUID companyId, UUID productId, int page, int size) {
        return listByCompany(companyId, null, productId, null, null, null, "createdAt", "desc", page, size);
    }

    public long countByCompany(UUID companyId, UUID productId) {
        return countByCompany(companyId, null, productId, null, null, null);
    }

    public List<StockMovementEntity> listRecentByCompany(UUID companyId, int limit) {
        return find("company.id = ?1", Sort.by("createdAt").descending(), companyId)
                .page(Page.of(0, limit))
                .list();
    }

    private String query(String search, UUID productId, StockMovementType type, LocalDate dateFrom, LocalDate dateTo) {
        StringBuilder query = new StringBuilder("company.id = :companyId");
        if (productId != null) {
            query.append(" and product.id = :productId");
        }
        if (type != null) {
            query.append(" and type = :type");
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
                    lower(product.name) like :search
                    or lower(coalesce(product.sku, '')) like :search
                    or lower(coalesce(reason, '')) like :search
                    or lower(str(type)) like :search
                )
                """);
        }
        return query.toString();
    }

    private Parameters parameters(UUID companyId, String search, UUID productId, StockMovementType type, LocalDate dateFrom, LocalDate dateTo) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (productId != null) {
            parameters.and("productId", productId);
        }
        if (type != null) {
            parameters.and("type", type);
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
            case "type" -> "type";
            case "quantity" -> "quantity";
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
