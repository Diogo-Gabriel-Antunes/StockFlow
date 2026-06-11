package com.stockflow.dashboard;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;

@Path("/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

    @Inject
    DashboardService dashboardService;

    @GET
    @Path("/summary")
    @Operation(
            summary = "Resumo gerencial do dashboard",
            description = "Retorna indicadores gerenciais da empresa autenticada para o período informado."
    )
    public DashboardSummaryResponse summary(
            @Parameter(description = "Período: today, last7days, currentMonth, previousMonth ou custom")
            @QueryParam("period") String period,
            @Parameter(description = "Data inicial no formato YYYY-MM-DD, obrigatória para period=custom")
            @QueryParam("dateFrom") LocalDate dateFrom,
            @Parameter(description = "Data final no formato YYYY-MM-DD, obrigatória para period=custom")
            @QueryParam("dateTo") LocalDate dateTo
    ) {
        return dashboardService.summary(period, dateFrom, dateTo);
    }
}
