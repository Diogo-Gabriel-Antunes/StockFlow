package com.stockflow.customers;

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

@Path("/customers")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class CustomerResource {

    @Inject
    CustomerService customerService;

    @GET
    public CustomerPageResponse list(
            @QueryParam("search") String search,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return customerService.list(search, page, size);
    }

    @POST
    public Response create(@Valid CustomerRequest request) {
        return Response.status(Response.Status.CREATED)
                .entity(customerService.create(request))
                .build();
    }

    @GET
    @Path("/{id}")
    public CustomerResponse get(@PathParam("id") UUID id) {
        return customerService.get(id);
    }

    @PUT
    @Path("/{id}")
    public CustomerResponse update(@PathParam("id") UUID id, @Valid CustomerRequest request) {
        return customerService.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        customerService.delete(id);
        return Response.noContent().build();
    }
}
