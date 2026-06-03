package com.stockflow.stock;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class StockMovementRepository implements PanacheRepositoryBase<StockMovementEntity, UUID> {

    public List<StockMovementEntity> listByCompany(UUID companyId, UUID productId, int page, int size) {
        return find(query(productId), Sort.by("createdAt").descending(), parameters(companyId, productId))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(UUID companyId, UUID productId) {
        return count(query(productId), parameters(companyId, productId));
    }

    private String query(UUID productId) {
        if (productId == null) {
            return "company.id = :companyId";
        }
        return "company.id = :companyId and product.id = :productId";
    }

    private Parameters parameters(UUID companyId, UUID productId) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (productId != null) {
            parameters.and("productId", productId);
        }
        return parameters;
    }
}
