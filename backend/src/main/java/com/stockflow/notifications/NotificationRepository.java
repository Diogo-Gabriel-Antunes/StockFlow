package com.stockflow.notifications;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class NotificationRepository implements PanacheRepositoryBase<NotificationEntity, UUID> {

    public List<NotificationEntity> listByCompany(
            UUID companyId,
            String status,
            NotificationType type,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        return find(query(status, type, dateFrom, dateTo), sort(), params(companyId, type, dateFrom, dateTo))
                .page(Page.of(page, size))
                .list();
    }

    public long countByCompany(UUID companyId, String status, NotificationType type, LocalDate dateFrom, LocalDate dateTo) {
        return count(query(status, type, dateFrom, dateTo), params(companyId, type, dateFrom, dateTo));
    }

    public long countUnread(UUID companyId) {
        return count("company.id = ?1 and readAt is null", companyId);
    }

    public Optional<NotificationEntity> findByCompanyAndId(UUID companyId, UUID id) {
        return find("company.id = ?1 and id = ?2", companyId, id).firstResultOptional();
    }

    public long markAllRead(UUID companyId, OffsetDateTime readAt) {
        return update("readAt = ?1, updatedAt = ?1 where company.id = ?2 and readAt is null", readAt, companyId);
    }

    private String query(String status, NotificationType type, LocalDate dateFrom, LocalDate dateTo) {
        StringBuilder query = new StringBuilder("company.id = :companyId");
        if ("unread".equalsIgnoreCase(status)) {
            query.append(" and readAt is null");
        } else if ("read".equalsIgnoreCase(status)) {
            query.append(" and readAt is not null");
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
        return query.toString();
    }

    private Parameters params(UUID companyId, NotificationType type, LocalDate dateFrom, LocalDate dateTo) {
        Parameters parameters = Parameters.with("companyId", companyId);
        if (type != null) {
            parameters.and("type", type);
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
