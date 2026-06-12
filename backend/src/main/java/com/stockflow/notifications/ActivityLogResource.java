package com.stockflow.notifications;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.Operation;

@Path("/activity-logs")
@Produces(MediaType.APPLICATION_JSON)
public class ActivityLogResource {

    @Inject
    ActivityLogService activityLogService;

    @GET
    @Operation(summary = "Lista histórico de atividades da empresa autenticada.")
    public ActivityLogPageResponse list(
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size,
            @QueryParam("actorType") ActorType actorType,
            @QueryParam("action") String action,
            @QueryParam("entityType") String entityType,
            @QueryParam("entityId") UUID entityId,
            @QueryParam("dateFrom") LocalDate dateFrom,
            @QueryParam("dateTo") LocalDate dateTo
    ) {
        return activityLogService.list(actorType, action, entityType, entityId, dateFrom, dateTo, page, size);
    }
}
