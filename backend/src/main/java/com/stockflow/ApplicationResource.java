package com.stockflow;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/")
public class ApplicationResource {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public ApiStatus status() {
        return new ApiStatus("StockFlow API", "ok");
    }

    public record ApiStatus(String name, String status) {
    }
}
