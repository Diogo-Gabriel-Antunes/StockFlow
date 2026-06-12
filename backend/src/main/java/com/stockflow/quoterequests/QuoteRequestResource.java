package com.stockflow.quoterequests;

import com.stockflow.quotes.QuoteResponse;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.Operation;

@Path("/quote-requests")
@Produces(MediaType.APPLICATION_JSON)
public class QuoteRequestResource {

    @Inject
    QuoteRequestService quoteRequestService;

    @GET
    @Operation(summary = "Lista solicitações de orçamento da empresa autenticada.")
    public QuoteRequestPageResponse list(
            @QueryParam("status") QuoteRequestStatus status,
            @QueryParam("search") String search,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return quoteRequestService.list(status, search, page, size);
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Retorna o detalhe de uma solicitação de orçamento da empresa autenticada.")
    public QuoteRequestResponse get(@PathParam("id") UUID id) {
        return quoteRequestService.get(id);
    }

    @PUT
    @Path("/{id}/status")
    @Operation(summary = "Atualiza o status operacional de uma solicitação de orçamento.")
    public QuoteRequestResponse updateStatus(@PathParam("id") UUID id, @Valid UpdateQuoteRequestStatusRequest input) {
        return quoteRequestService.updateStatus(id, input);
    }

    @POST
    @Path("/{id}/convert-to-quote")
    @Operation(summary = "Converte uma solicitação de orçamento em orçamento rascunho.")
    public QuoteResponse convertToQuote(@PathParam("id") UUID id) {
        return quoteRequestService.convertToQuote(id);
    }
}
