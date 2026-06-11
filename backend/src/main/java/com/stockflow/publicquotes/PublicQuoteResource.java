package com.stockflow.publicquotes;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;

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
    @Operation(summary = "Gera o PDF público de uma proposta por token.")
    @APIResponse(responseCode = "200", description = "PDF público da proposta", content = @Content(mediaType = "application/pdf"))
    public Response pdf(@PathParam("token") String token) {
        var pdf = publicQuoteService.pdf(token);
        return Response.ok(pdf.content(), "application/pdf")
                .header("Content-Disposition", "inline; filename=\"" + pdf.filename() + "\"")
                .build();
    }
}
