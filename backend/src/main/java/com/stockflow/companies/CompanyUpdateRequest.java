package com.stockflow.companies;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyUpdateRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 32) String document,
        @Email @Size(max = 160) String email,
        @Size(max = 32) String phone,
        @Size(max = 500) String logoUrl
) {
}
