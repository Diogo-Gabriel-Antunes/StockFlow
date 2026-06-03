package com.stockflow.stock;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;

@Path("/stock")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class StockResource {

    @Inject
    StockService stockService;

    @GET
    @Path("/movements")
    public StockMovementPageResponse movements(
            @QueryParam("productId") UUID productId,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return stockService.listMovements(productId, page, size);
    }

    @GET
    @Path("/low")
    public List<LowStockProductResponse> lowStock() {
        return stockService.listLowStock();
    }

    @POST
    @Path("/entries")
    public StockMovementResponse entry(@Valid StockMovementRequest request) {
        return stockService.entry(request);
    }

    @POST
    @Path("/outputs")
    public StockMovementResponse output(@Valid StockMovementRequest request) {
        return stockService.output(request);
    }

    @POST
    @Path("/adjustments")
    public StockMovementResponse adjustment(@Valid StockAdjustmentRequest request) {
        return stockService.adjustment(request);
    }
}
