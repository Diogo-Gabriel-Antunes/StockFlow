package com.stockflow.customerportal;

import com.stockflow.publicquotes.RejectPublicQuoteRequest;
import com.stockflow.quoterequests.QuoteRequestInput;
import com.stockflow.quoterequests.QuoteRequestResponse;
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
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;

@Path("/public/customer-portal/{token}")
@Produces(MediaType.APPLICATION_JSON)
public class CustomerPortalResource {

    @Inject
    CustomerPortalService customerPortalService;

    @GET
    @Operation(summary = "Retorna o resumo público do portal do cliente por token.")
    public CustomerPortalOverviewResponse overview(@PathParam("token") String token) {
        return customerPortalService.overview(token);
    }

    @GET
    @Path("/quotes")
    @Operation(summary = "Lista propostas do cliente no portal público.")
    public CustomerPortalQuotePageResponse quotes(
            @PathParam("token") String token,
            @QueryParam("statusGroup") String statusGroup,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return customerPortalService.quotes(token, statusGroup, page, size);
    }

    @GET
    @Path("/quotes/{quoteId}")
    @Operation(summary = "Retorna o detalhe de uma proposta do cliente no portal público.")
    public CustomerPortalQuoteResponse quote(@PathParam("token") String token, @PathParam("quoteId") UUID quoteId) {
        return customerPortalService.quote(token, quoteId);
    }

    @POST
    @Path("/quotes/{quoteId}/approve")
    @Operation(summary = "Aprova uma proposta enviada pelo portal do cliente.")
    public CustomerPortalQuoteResponse approve(@PathParam("token") String token, @PathParam("quoteId") UUID quoteId) {
        return customerPortalService.approve(token, quoteId);
    }

    @POST
    @Path("/quotes/{quoteId}/reject")
    @Operation(summary = "Recusa uma proposta enviada pelo portal do cliente.")
    public CustomerPortalQuoteResponse reject(
            @PathParam("token") String token,
            @PathParam("quoteId") UUID quoteId,
            @Valid RejectPublicQuoteRequest request
    ) {
        return customerPortalService.reject(token, quoteId, request);
    }

    @GET
    @Path("/quotes/{quoteId}/pdf")
    @Produces("application/pdf")
    @Operation(summary = "Gera o PDF de uma proposta pelo portal do cliente.")
    @APIResponse(responseCode = "200", description = "PDF da proposta", content = @Content(mediaType = "application/pdf"))
    public Response pdf(@PathParam("token") String token, @PathParam("quoteId") UUID quoteId) {
        var pdf = customerPortalService.pdf(token, quoteId);
        return Response.ok(pdf.content(), "application/pdf")
                .header("Content-Disposition", "inline; filename=\"" + pdf.filename() + "\"")
                .build();
    }

    @GET
    @Path("/products")
    @Operation(summary = "Lista o catálogo público de produtos ativos do cliente.")
    public CustomerPortalProductPageResponse products(
            @PathParam("token") String token,
            @QueryParam("search") String search,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return customerPortalService.products(token, search, page, size);
    }

    @GET
    @Path("/products/search")
    @Operation(summary = "Busca produtos ativos para autocomplete no portal do cliente.")
    public List<CustomerPortalProductResponse> searchProducts(
            @PathParam("token") String token,
            @QueryParam("query") String query
    ) {
        return customerPortalService.searchProducts(token, query);
    }

    @GET
    @Path("/products/{productId}")
    @Operation(summary = "Retorna um produto ativo do catálogo público do cliente.")
    public CustomerPortalProductResponse product(
            @PathParam("token") String token,
            @PathParam("productId") UUID productId
    ) {
        return customerPortalService.product(token, productId);
    }

    @GET
    @Path("/quote-requests")
    @Operation(summary = "Lista solicitações de orçamento do cliente no portal público.")
    public List<QuoteRequestResponse> quoteRequests(@PathParam("token") String token) {
        return customerPortalService.quoteRequests(token);
    }

    @GET
    @Path("/quote-requests/{requestId}")
    @Operation(summary = "Retorna uma solicitação de orçamento do cliente.")
    public QuoteRequestResponse quoteRequest(@PathParam("token") String token, @PathParam("requestId") UUID requestId) {
        return customerPortalService.quoteRequest(token, requestId);
    }

    @POST
    @Path("/quote-requests")
    @Operation(summary = "Cria uma solicitação de orçamento pelo portal do cliente.")
    public QuoteRequestResponse createQuoteRequest(@PathParam("token") String token, @Valid QuoteRequestInput input) {
        return customerPortalService.createQuoteRequest(token, input);
    }

    @PUT
    @Path("/quote-requests/{requestId}")
    @Operation(summary = "Atualiza uma solicitação de orçamento aberta pelo portal do cliente.")
    public QuoteRequestResponse updateQuoteRequest(
            @PathParam("token") String token,
            @PathParam("requestId") UUID requestId,
            @Valid QuoteRequestInput input
    ) {
        return customerPortalService.updateQuoteRequest(token, requestId, input);
    }

    @POST
    @Path("/quote-requests/{requestId}/cancel")
    @Operation(summary = "Cancela uma solicitação de orçamento aberta pelo portal do cliente.")
    public QuoteRequestResponse cancelQuoteRequest(@PathParam("token") String token, @PathParam("requestId") UUID requestId) {
        return customerPortalService.cancelQuoteRequest(token, requestId);
    }
}
