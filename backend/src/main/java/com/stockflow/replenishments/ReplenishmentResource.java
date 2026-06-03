package com.stockflow.replenishments;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/replenishments")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ReplenishmentResource {

    @Inject
    ReplenishmentService replenishmentService;

    @GET
    public List<ReplenishmentProductResponse> listCriticalProducts() {
        return replenishmentService.listCriticalProducts();
    }

    @POST
    @Path("/entries")
    public ReplenishmentEntryResponse registerEntry(@Valid ReplenishmentEntryRequest request) {
        return replenishmentService.registerEntry(request);
    }
}
