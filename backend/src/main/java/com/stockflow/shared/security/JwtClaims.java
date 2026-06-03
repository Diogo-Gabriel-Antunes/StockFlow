package com.stockflow.shared.security;

import com.stockflow.users.UserRole;
import java.util.UUID;

public record JwtClaims(
        UUID userId,
        UUID companyId,
        String email,
        UserRole role
) {
}
