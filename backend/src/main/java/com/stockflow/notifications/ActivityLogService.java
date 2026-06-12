package com.stockflow.notifications;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.customers.CustomerEntity;
import com.stockflow.shared.security.AuthenticatedTenant;
import com.stockflow.users.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDate;
import java.util.UUID;

@ApplicationScoped
public class ActivityLogService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    ActivityLogRepository activityLogRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    public ActivityLogPageResponse list(
            ActorType actorType,
            String action,
            String entityType,
            UUID entityId,
            LocalDate dateFrom,
            LocalDate dateTo,
            Integer page,
            Integer size
    ) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();
        return new ActivityLogPageResponse(
                activityLogRepository.listByCompany(companyId, actorType, action, entityType, entityId, dateFrom, dateTo, safePage, safeSize)
                        .stream()
                        .map(ActivityLogResponse::from)
                        .toList(),
                safePage,
                safeSize,
                activityLogRepository.countByCompany(companyId, actorType, action, entityType, entityId, dateFrom, dateTo)
        );
    }

    public ActivityLogEntity record(
            CompanyEntity company,
            ActorType actorType,
            UserEntity actorUser,
            CustomerEntity actorCustomer,
            String action,
            String entityType,
            UUID entityId,
            String description,
            String metadata
    ) {
        ActivityLogEntity activity = new ActivityLogEntity();
        activity.company = company;
        activity.actorType = actorType;
        activity.actorUser = actorUser;
        activity.actorCustomer = actorCustomer;
        activity.action = action;
        activity.entityType = entityType;
        activity.entityId = entityId;
        activity.description = description;
        activity.metadata = metadata;
        activityLogRepository.persist(activity);
        return activity;
    }
}
