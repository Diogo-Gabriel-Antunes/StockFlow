package com.stockflow.stock;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.time.LocalDate;
import java.util.UUID;
import com.stockflow.replenishments.ReplenishmentEntryResponse;
import com.stockflow.replenishments.ReplenishmentProductPageResponse;
import com.stockflow.replenishments.ReplenishmentProductResponse;
import com.stockflow.replenishments.ReplenishmentService;
import com.stockflow.replenishments.RestockRequest;
import org.eclipse.microprofile.openapi.annotations.Operation;

@Path("/stock")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class StockResource {

    @Inject
    StockService stockService;

    @Inject
    ReplenishmentService replenishmentService;

    @GET
    @Path("/movements")
    @Operation(
            summary = "Listar movimentações de estoque",
            description = "Lista movimentações de estoque da empresa atual."
    )
    public StockMovementPageResponse movements(
            @QueryParam("search") String search,
            @QueryParam("productId") UUID productId,
            @QueryParam("type") StockMovementType type,
            @QueryParam("dateFrom") LocalDate dateFrom,
            @QueryParam("dateTo") LocalDate dateTo,
            @QueryParam("sort") String sort,
            @QueryParam("direction") String direction,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return stockService.listMovements(search, productId, type, dateFrom, dateTo, sort, direction, page, size);
    }

    @GET
    @Path("/movements/product/{productId}")
    @Operation(
            summary = "Listar movimentações de estoque por produto",
            description = "Lista movimentações de estoque de um produto específico da empresa atual."
    )
    public StockMovementPageResponse movementsByProduct(
            @PathParam("productId") UUID productId,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return stockService.listMovementsByProduct(productId, page, size);
    }

    @GET
    @Path("/low")
    @Operation(
            summary = "Listar produtos com estoque baixo",
            description = "Retorna produtos ativos da empresa atual cujo estoque está menor ou igual ao estoque mínimo."
    )
    public List<LowStockProductResponse> lowStock() {
        return stockService.listLowStock();
    }

    @GET
    @Path("/replenishment")
    @Operation(
            summary = "Listar produtos para reposição",
            description = "Lista produtos ativos da empresa atual que estão no estoque mínimo ou abaixo dele."
    )
    public ReplenishmentProductPageResponse replenishment(
            @QueryParam("search") String search,
            @QueryParam("status") String status,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size
    ) {
        return replenishmentService.listCriticalProducts(search, status, page, size);
    }

    @POST
    @Path("/replenishment/{productId}/restock")
    @Operation(
            summary = "Registrar reposição rápida",
            description = "Registra uma entrada de estoque por reposição para um produto da empresa atual."
    )
    public ReplenishmentEntryResponse restock(
            @PathParam("productId") UUID productId,
            @Valid RestockRequest request
    ) {
        return replenishmentService.restock(productId, request);
    }

    @POST
    @Path("/entries")
    @Operation(
            summary = "Registrar entrada de estoque",
            description = "Registra entrada de estoque para um produto da empresa atual."
    )
    public StockMovementResponse entry(@Valid StockMovementRequest request) {
        return stockService.entry(request);
    }

    @POST
    @Path("/outputs")
    @Operation(
            summary = "Registrar saída de estoque",
            description = "Registra saída de estoque para um produto da empresa atual."
    )
    public StockMovementResponse output(@Valid StockMovementRequest request) {
        return stockService.output(request);
    }

    @POST
    @Path("/adjustments")
    @Operation(
            summary = "Ajustar estoque manualmente",
            description = "Ajusta manualmente o estoque de um produto da empresa atual."
    )
    public StockMovementResponse adjustment(@Valid StockAdjustmentRequest request) {
        return stockService.adjustment(request);
    }
}
