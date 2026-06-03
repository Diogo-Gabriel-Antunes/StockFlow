package com.stockflow.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 160) String companyName,
        @Size(max = 32) String companyDocument,
        @Email @Size(max = 160) String companyEmail,
        @Size(max = 32) String companyPhone,
        @NotBlank @Size(max = 160) String ownerName,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 8, max = 120) String password
) {
}
