package com.stockflow.auth;

import com.stockflow.companies.CompanyResponse;
import com.stockflow.users.UserResponse;

public record MeResponse(
        UserResponse user,
        CompanyResponse company
) {
}
