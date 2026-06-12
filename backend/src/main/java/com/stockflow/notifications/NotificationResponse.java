package com.stockflow.notifications;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        String sourceType,
        UUID sourceId,
        String link,
        boolean read,
        OffsetDateTime readAt,
        OffsetDateTime createdAt
) {
    public static NotificationResponse from(NotificationEntity entity) {
        return new NotificationResponse(
                entity.id,
                entity.type,
                entity.title,
                entity.message,
                entity.sourceType,
                entity.sourceId,
                entity.link,
                entity.readAt != null,
                entity.readAt,
                entity.createdAt
        );
    }
}
