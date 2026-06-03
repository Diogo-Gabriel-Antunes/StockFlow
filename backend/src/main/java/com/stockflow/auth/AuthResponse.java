package com.stockflow.auth;

import com.stockflow.companies.CompanyResponse;
import com.stockflow.users.UserResponse;

public record AuthResponse(
        String token,
        UserResponse user,
        CompanyResponse company
) {
}
