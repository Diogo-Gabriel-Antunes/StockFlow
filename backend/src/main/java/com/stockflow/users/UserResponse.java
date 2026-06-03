package com.stockflow.users;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        UUID companyId,
        String name,
        String email,
        UserRole role,
        boolean active,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static UserResponse from(UserEntity user) {
        return new UserResponse(
                user.id,
                user.company.id,
                user.name,
                user.email,
                user.role,
                user.active,
                user.createdAt,
                user.updatedAt
        );
    }
}
