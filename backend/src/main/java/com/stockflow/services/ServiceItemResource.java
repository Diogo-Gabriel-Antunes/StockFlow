package com.stockflow.services;

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

@Path("/services")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ServiceItemResource {

    @Inject
    ServiceItemService serviceItemService;

    @GET
    public ServiceItemPageResponse list(
            @QueryParam("search") String search,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return serviceItemService.list(search, page, size);
    }

    @POST
    public Response create(@Valid ServiceItemRequest request) {
        return Response.status(Response.Status.CREATED)
                .entity(serviceItemService.create(request))
                .build();
    }

    @GET
    @Path("/{id}")
    public ServiceItemResponse get(@PathParam("id") UUID id) {
        return serviceItemService.get(id);
    }

    @PUT
    @Path("/{id}")
    public ServiceItemResponse update(@PathParam("id") UUID id, @Valid ServiceItemRequest request) {
        return serviceItemService.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        serviceItemService.delete(id);
        return Response.noContent().build();
    }
}
