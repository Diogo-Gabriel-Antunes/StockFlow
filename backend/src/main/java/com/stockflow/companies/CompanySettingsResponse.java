package com.stockflow.companies;

public record CompanySettingsResponse(
        String tradeName,
        String legalName,
        String document,
        String email,
        String phone,
        String whatsapp,
        String address,
        String addressNumber,
        String addressComplement,
        String neighborhood,
        String city,
        String state,
        String zipCode,
        String defaultQuoteNotes,
        String defaultPaymentTerms,
        Integer defaultQuoteValidityDays
) {
    public static CompanySettingsResponse from(CompanyEntity company) {
        return new CompanySettingsResponse(
                commercialName(company),
                company.legalName,
                company.document,
                company.email,
                company.phone,
                company.whatsapp,
                company.address,
                company.addressNumber,
                company.addressComplement,
                company.neighborhood,
                company.city,
                company.state,
                company.zipCode,
                company.defaultQuoteNotes,
                company.defaultPaymentTerms,
                company.defaultQuoteValidityDays
        );
    }

    public static String commercialName(CompanyEntity company) {
        if (company.tradeName != null && !company.tradeName.isBlank()) {
            return company.tradeName;
        }
        return company.name;
    }
}
