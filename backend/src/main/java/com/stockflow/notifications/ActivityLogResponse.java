package com.stockflow.notifications;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ActivityLogResponse(
        UUID id,
        ActorType actorType,
        UUID actorUserId,
        UUID actorCustomerId,
        String action,
        String entityType,
        UUID entityId,
        String description,
        String metadata,
        OffsetDateTime createdAt
) {
    public static ActivityLogResponse from(ActivityLogEntity entity) {
        return new ActivityLogResponse(
                entity.id,
                entity.actorType,
                entity.actorUser == null ? null : entity.actorUser.id,
                entity.actorCustomer == null ? null : entity.actorCustomer.id,
                entity.action,
                entity.entityType,
                entity.entityId,
                entity.description,
                entity.metadata,
                entity.createdAt
        );
    }
}
