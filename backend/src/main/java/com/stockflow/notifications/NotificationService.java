package com.stockflow.notifications;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.shared.security.AuthenticatedTenant;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@ApplicationScoped
public class NotificationService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    NotificationRepository notificationRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    public NotificationPageResponse list(
            String status,
            NotificationType type,
            LocalDate dateFrom,
            LocalDate dateTo,
            Integer page,
            Integer size
    ) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();
        return new NotificationPageResponse(
                notificationRepository.listByCompany(companyId, status, type, dateFrom, dateTo, safePage, safeSize)
                        .stream()
                        .map(NotificationResponse::from)
                        .toList(),
                safePage,
                safeSize,
                notificationRepository.countByCompany(companyId, status, type, dateFrom, dateTo)
        );
    }

    public UnreadCountResponse unreadCount() {
        return new UnreadCountResponse(notificationRepository.countUnread(authenticatedTenant.companyId()));
    }

    @Transactional
    public NotificationResponse markRead(UUID id) {
        NotificationEntity notification = notificationRepository.findByCompanyAndId(authenticatedTenant.companyId(), id)
                .orElseThrow(NotFoundException::new);
        if (notification.readAt == null) {
            notification.readAt = OffsetDateTime.now();
        }
        return NotificationResponse.from(notification);
    }

    @Transactional
    public MarkAllReadResponse markAllRead() {
        return new MarkAllReadResponse(notificationRepository.markAllRead(authenticatedTenant.companyId(), OffsetDateTime.now()));
    }

    public NotificationEntity create(
            CompanyEntity company,
            NotificationType type,
            String title,
            String message,
            String sourceType,
            UUID sourceId,
            String link
    ) {
        NotificationEntity notification = new NotificationEntity();
        notification.company = company;
        notification.type = type;
        notification.title = title;
        notification.message = message;
        notification.sourceType = sourceType;
        notification.sourceId = sourceId;
        notification.link = link;
        notificationRepository.persist(notification);
        return notification;
    }
}
