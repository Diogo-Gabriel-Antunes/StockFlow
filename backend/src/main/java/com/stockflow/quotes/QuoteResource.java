package com.stockflow.quotes;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDate;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;

@Path("/quotes")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class QuoteResource {

    @Inject
    QuoteService quoteService;

    @GET
    public QuotePageResponse list(
            @QueryParam("search") String search,
            @QueryParam("status") QuoteStatus status,
            @QueryParam("customerId") UUID customerId,
            @QueryParam("dateFrom") LocalDate dateFrom,
            @QueryParam("dateTo") LocalDate dateTo,
            @QueryParam("sort") String sort,
            @QueryParam("direction") String direction,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return quoteService.list(search, status, customerId, dateFrom, dateTo, sort, direction, page, size);
    }

    @POST
    public Response create(@Valid QuoteRequest request) {
        return Response.status(Response.Status.CREATED)
                .entity(quoteService.create(request))
                .build();
    }

    @GET
    @Path("/{id}")
    public QuoteResponse get(@PathParam("id") UUID id) {
        return quoteService.get(id);
    }

    @PUT
    @Path("/{id}")
    public QuoteResponse update(@PathParam("id") UUID id, @Valid QuoteRequest request) {
        return quoteService.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        quoteService.delete(id);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/send")
    public QuoteResponse send(@PathParam("id") UUID id) {
        return quoteService.send(id);
    }

    @POST
    @Path("/{id}/approve")
    public QuoteResponse approve(@PathParam("id") UUID id) {
        return quoteService.approve(id);
    }

    @POST
    @Path("/{id}/mark-customer-approved")
    public QuoteResponse markCustomerApproved(@PathParam("id") UUID id) {
        return quoteService.markCustomerApproved(id);
    }

    @POST
    @Path("/{id}/complete")
    public QuoteResponse complete(@PathParam("id") UUID id) {
        return quoteService.complete(id);
    }

    @POST
    @Path("/{id}/reject")
    public QuoteResponse reject(@PathParam("id") UUID id) {
        return quoteService.reject(id);
    }

    @POST
    @Path("/{id}/cancel")
    public QuoteResponse cancel(@PathParam("id") UUID id) {
        return quoteService.cancel(id);
    }

    @POST
    @Path("/{id}/public-token")
    public com.stockflow.publicquotes.PublicQuoteLinkResponse publicToken(@PathParam("id") UUID id) {
        return quoteService.generatePublicLink(id);
    }

    @GET
    @Path("/{id}/pdf")
    @Produces("application/pdf")
    @Operation(summary = "Gera o PDF de um orçamento da empresa autenticada.")
    @APIResponse(responseCode = "200", description = "PDF do orçamento", content = @Content(mediaType = "application/pdf"))
    public Response pdf(@PathParam("id") UUID id) {
        var pdf = quoteService.pdf(id);
        return Response.ok(pdf.content(), "application/pdf")
                .header("Content-Disposition", "inline; filename=\"" + pdf.filename() + "\"")
                .build();
    }
}
