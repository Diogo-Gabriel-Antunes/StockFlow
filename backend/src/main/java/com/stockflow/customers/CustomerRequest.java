package com.stockflow.customers;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank @Size(max = 160) String name,
        @NotNull CustomerType type,
        @Size(max = 32) String document,
        @Email @Size(max = 160) String email,
        @Size(max = 32) String phone,
        @Size(max = 32) String whatsapp,
        @Size(max = 120) String city,
        @Size(min = 2, max = 2) String state,
        @Size(max = 1000) String notes
) {
}
