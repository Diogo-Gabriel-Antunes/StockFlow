package com.stockflow.notifications;

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
public class ActivityLogRepository implements PanacheRepositoryBase<ActivityLogEntity, UUID> {

    public List<ActivityLogEntity> listByCompany(
            UUID companyId,
            ActorType actorType,
            String action,
            String entityType,
            UUID entityId,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        return find(query(actorType, action, entityType, entityId, dateFrom, dateTo), sort(),
                params(companyId, actorType, action, entityType, entityId, dateFrom, dateTo))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(
            UUID companyId,
            ActorType actorType,
            String action,
            String entityType,
            UUID entityId,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        return count(query(actorType, action, entityType, entityId, dateFrom, dateTo),
                params(companyId, actorType, action, entityType, entityId, dateFrom, dateTo));
    }

    private String query(ActorType actorType, String action, String entityType, UUID entityId, LocalDate dateFrom, LocalDate dateTo) {
        StringBuilder query = new StringBuilder("company.id = :companyId");
        if (actorType != null) {
            query.append(" and actorType = :actorType");
        }
        if (action != null && !action.isBlank()) {
            query.append(" and action = :action");
        }
        if (entityType != null && !entityType.isBlank()) {
            query.append(" and entityType = :entityType");
        }
        if (entityId != null) {
            query.append(" and entityId = :entityId");
        }
        if (dateFrom != null) {
            query.append(" and createdAt >= :dateFrom");
        }
        if (dateTo != null) {
            query.append(" and createdAt < :dateTo");
        }
        return query.toString();
    }

    private Parameters params(UUID companyId, ActorType actorType, String action, String entityType, UUID entityId, LocalDate dateFrom, LocalDate dateTo) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (actorType != null) {
            parameters.and("actorType", actorType);
        }
        if (action != null && !action.isBlank()) {
            parameters.and("action", action.trim());
        }
        if (entityType != null && !entityType.isBlank()) {
            parameters.and("entityType", entityType.trim());
        }
        if (entityId != null) {
            parameters.and("entityId", entityId);
        }
        if (dateFrom != null) {
            parameters.and("dateFrom", dateFrom.atStartOfDay().atOffset(ZoneOffset.UTC));
        }
        if (dateTo != null) {
            parameters.and("dateTo", dateTo.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC));
        }
        return parameters;
    }

    private Sort sort() {
        return Sort.by("createdAt").descending();
    }
}
