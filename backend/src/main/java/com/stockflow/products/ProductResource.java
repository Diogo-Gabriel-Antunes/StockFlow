package com.stockflow.products;

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

@Path("/products")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ProductResource {

    @Inject
    ProductService productService;

    @GET
    public ProductPageResponse list(
            @QueryParam("search") String search,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return productService.list(search, page, size);
    }

    @POST
    public Response create(@Valid ProductRequest request) {
        return Response.status(Response.Status.CREATED)
                .entity(productService.create(request))
                .build();
    }

    @GET
    @Path("/{id}")
    public ProductResponse get(@PathParam("id") UUID id) {
        return productService.get(id);
    }

    @PUT
    @Path("/{id}")
    public ProductResponse update(@PathParam("id") UUID id, @Valid ProductRequest request) {
        return productService.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") UUID id) {
        productService.delete(id);
        return Response.noContent().build();
    }
}
