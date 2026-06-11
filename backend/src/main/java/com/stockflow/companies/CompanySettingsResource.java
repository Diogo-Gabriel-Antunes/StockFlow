package com.stockflow.companies;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;

@Path("/company/settings")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class CompanySettingsResource {

    @Inject
    CompanySettingsService companySettingsService;

    @GET
    @Operation(
            summary = "Consultar configurações comerciais da empresa",
            description = "Retorna as configurações comerciais da empresa autenticada."
    )
    public CompanySettingsResponse get() {
        return companySettingsService.get();
    }

    @PUT
    @Operation(
            summary = "Atualizar configurações comerciais da empresa",
            description = "Atualiza as configurações comerciais da empresa autenticada."
    )
    public CompanySettingsResponse update(@Valid UpdateCompanySettingsRequest request) {
        return companySettingsService.update(request);
    }
}
