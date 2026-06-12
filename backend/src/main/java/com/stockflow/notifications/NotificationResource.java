package com.stockflow.notifications;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.Operation;

@Path("/notifications")
@Produces(MediaType.APPLICATION_JSON)
public class NotificationResource {

    @Inject
    NotificationService notificationService;

    @GET
    @Operation(summary = "Lista notificações da empresa autenticada.")
    public NotificationPageResponse list(
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size,
            @QueryParam("status") String status,
            @QueryParam("type") NotificationType type,
            @QueryParam("dateFrom") LocalDate dateFrom,
            @QueryParam("dateTo") LocalDate dateTo
    ) {
        return notificationService.list(status, type, dateFrom, dateTo, page, size);
    }

    @GET
    @Path("/unread-count")
    @Operation(summary = "Retorna quantidade de notificações não lidas.")
    public UnreadCountResponse unreadCount() {
        return notificationService.unreadCount();
    }

    @POST
    @Path("/{id}/read")
    @Operation(summary = "Marca notificação como lida.")
    public NotificationResponse markRead(@PathParam("id") UUID id) {
        return notificationService.markRead(id);
    }

    @POST
    @Path("/read-all")
    @Operation(summary = "Marca todas as notificações como lidas.")
    public MarkAllReadResponse markAllRead() {
        return notificationService.markAllRead();
    }
}
