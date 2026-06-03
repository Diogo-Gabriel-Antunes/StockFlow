package com.stockflow.companies;

import com.stockflow.shared.security.AuthenticatedTenant;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/companies/me")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class CompanyResource {

    @Inject
    CompanyRepository companyRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    @GET
    public CompanyResponse getCurrentCompany() {
        return CompanyResponse.from(findCurrentCompany());
    }

    @PUT
    @Transactional
    public CompanyResponse updateCurrentCompany(@Valid CompanyUpdateRequest request) {
        CompanyEntity company = findCurrentCompany();
        company.name = request.name().trim();
        company.document = trimToNull(request.document());
        company.email = trimToNull(request.email());
        company.phone = trimToNull(request.phone());
        company.logoUrl = trimToNull(request.logoUrl());
        return CompanyResponse.from(company);
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
