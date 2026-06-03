package com.stockflow.publicquotes;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/public/quotes")
@Produces(MediaType.APPLICATION_JSON)
public class PublicQuoteResource {

    @Inject
    PublicQuoteService publicQuoteService;

    @GET
    @Path("/{token}")
    public PublicQuoteResponse get(@PathParam("token") String token) {
        return publicQuoteService.get(token);
    }

    @POST
    @Path("/{token}/approve")
    public PublicQuoteResponse approve(@PathParam("token") String token) {
        return publicQuoteService.approve(token);
    }

    @POST
    @Path("/{token}/reject")
    public PublicQuoteResponse reject(@PathParam("token") String token) {
        return publicQuoteService.reject(token);
    }

    @GET
    @Path("/{token}/pdf")
    @Produces("application/pdf")
    public Response pdf(@PathParam("token") String token) {
        return Response.ok(publicQuoteService.pdf(token), "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"stockflow-proposta.pdf\"")
                .build();
    }
}
