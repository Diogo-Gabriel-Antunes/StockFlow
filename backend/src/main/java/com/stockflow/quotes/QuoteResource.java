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
import java.util.UUID;

@Path("/quotes")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class QuoteResource {

    @Inject
    QuoteService quoteService;

    @GET
    public QuotePageResponse list(
            @QueryParam("status") QuoteStatus status,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return quoteService.list(status, page, size);
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
    @Path("/{id}/reject")
    public QuoteResponse reject(@PathParam("id") UUID id) {
        return quoteService.reject(id);
    }

    @POST
    @Path("/{id}/public-token")
    public com.stockflow.publicquotes.PublicQuoteLinkResponse publicToken(@PathParam("id") UUID id) {
        return quoteService.generatePublicLink(id);
    }

    @GET
    @Path("/{id}/pdf")
    @Produces("application/pdf")
    public Response pdf(@PathParam("id") UUID id) {
        return Response.ok(quoteService.pdf(id), "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"stockflow-proposta.pdf\"")
                .build();
    }
}
