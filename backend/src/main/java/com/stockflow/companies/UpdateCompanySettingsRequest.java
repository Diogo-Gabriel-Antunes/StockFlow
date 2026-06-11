package com.stockflow.companies;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCompanySettingsRequest(
        @NotBlank @Size(max = 160) String tradeName,
        @Size(max = 180) String legalName,
        @Size(max = 32) String document,
        @Email @Size(max = 160) String email,
        @Size(max = 32) String phone,
        @Size(max = 32) String whatsapp,
        @Size(max = 180) String address,
        @Size(max = 30) String addressNumber,
        @Size(max = 120) String addressComplement,
        @Size(max = 120) String neighborhood,
        @Size(max = 120) String city,
        @Size(max = 2) String state,
        @Size(max = 20) String zipCode,
        String defaultQuoteNotes,
        String defaultPaymentTerms,
        @Min(1) @Max(365) Integer defaultQuoteValidityDays
) {
}
