package com.stockflow.companies;

import com.stockflow.shared.security.AuthenticatedTenant;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class CompanySettingsService {

    @Inject
    CompanyRepository companyRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    public CompanySettingsResponse get() {
        return CompanySettingsResponse.from(findCurrentCompany());
    }

    @Transactional
    public CompanySettingsResponse update(UpdateCompanySettingsRequest request) {
        CompanyEntity company = findCurrentCompany();
        company.tradeName = trimToNull(request.tradeName());
        company.legalName = trimToNull(request.legalName());
        company.document = trimToNull(request.document());
        company.email = trimToNull(request.email());
        company.phone = trimToNull(request.phone());
        company.whatsapp = trimToNull(request.whatsapp());
        company.address = trimToNull(request.address());
        company.addressNumber = trimToNull(request.addressNumber());
        company.addressComplement = trimToNull(request.addressComplement());
        company.neighborhood = trimToNull(request.neighborhood());
        company.city = trimToNull(request.city());
        company.state = trimToNull(request.state());
        company.zipCode = trimToNull(request.zipCode());
        company.defaultQuoteNotes = trimToNull(request.defaultQuoteNotes());
        company.defaultPaymentTerms = trimToNull(request.defaultPaymentTerms());
        company.defaultQuoteValidityDays = request.defaultQuoteValidityDays();
        return CompanySettingsResponse.from(company);
    }

    private CompanyEntity findCurrentCompany() {
        return companyRepository.findByIdOptional(authenticatedTenant.companyId())
                .orElseThrow(NotFoundException::new);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
