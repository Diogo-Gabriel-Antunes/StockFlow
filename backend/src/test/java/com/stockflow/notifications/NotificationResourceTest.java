package com.stockflow.notifications;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class NotificationResourceTest {

    @Test
    void notificationsAreCompanyScopedAndCanBeMarkedAsRead() {
        String token = registerAndToken("notifications-a");
        String otherToken = registerAndToken("notifications-b");
        String customerId = createCustomer(token, "Cliente Notificacao");
        String productId = createProduct(token, "Produto Notificacao", "NOT-1", "30.00", "10.000", "2.000");
        String quoteId = createQuote(token, customerId, productId);
        sendQuote(token, quoteId);
        String publicToken = createPublicToken(token, quoteId);

        given()
                .when()
                .get("/notifications")
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .when()
                .post("/public/quotes/{token}/approve", publicToken)
                .then()
                .statusCode(200)
                .body("status", equalTo("CUSTOMER_APPROVED"));

        String notificationId = given()
                .header("Authorization", "Bearer " + token)
                .queryParam("status", "unread")
                .queryParam("type", "QUOTE_APPROVED")
                .when()
                .get("/notifications")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].type", equalTo("QUOTE_APPROVED"))
                .body("items[0].title", equalTo("Proposta aprovada"))
                .body("items[0].message", containsString("Cliente Notificacao"))
                .body("items[0].link", equalTo("/quotes/" + quoteId))
                .body("items[0].read", equalTo(false))
                .body("totalElements", equalTo(1))
                .extract()
                .path("items[0].id");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/notifications/unread-count")
                .then()
                .statusCode(200)
                .body("count", equalTo(1));

        given()
                .header("Authorization", "Bearer " + otherToken)
                .when()
                .get("/notifications")
                .then()
                .statusCode(200)
                .body("totalElements", equalTo(0));

        given()
                .header("Authorization", "Bearer " + otherToken)
                .when()
                .post("/notifications/{id}/read", notificationId)
                .then()
                .statusCode(404);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/notifications/{id}/read", notificationId)
                .then()
                .statusCode(200)
                .body("read", equalTo(true))
                .body("readAt", notNullValue());

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/notifications/unread-count")
                .then()
                .statusCode(200)
                .body("count", equalTo(0));
    }

    @Test
    void quoteRequestEventsCreateNotificationsAndActivityLogs() {
        String token = registerAndToken("notifications-request");
        String otherToken = registerAndToken("notifications-request-other");
        CustomerData customer = createCustomerWithPortalToken(token, "Cliente Solicitação");

        String requestId = given()
                .contentType("application/json")
                .body(Map.of(
                        "title", "Uniformes",
                        "description", "Pedido inicial",
                        "items", List.of(Map.of(
                                "description", "Bandana tamanho M",
                                "quantity", "20.000",
                                "notes", "Cores variadas"
                        ))
                ))
                .when()
                .post("/public/customer-portal/{token}/quote-requests", customer.portalToken())
                .then()
                .statusCode(200)
                .body("status", equalTo("REQUESTED"))
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("type", "QUOTE_REQUEST_CREATED")
                .when()
                .get("/notifications")
                .then()
                .statusCode(200)
                .body("totalElements", equalTo(1))
                .body("items[0].link", equalTo("/quote-requests/" + requestId));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("entityType", "QUOTE_REQUEST")
                .when()
                .get("/activity-logs")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].actorType", equalTo("CUSTOMER"))
                .body("items[0].action", equalTo("QUOTE_REQUEST_CREATED"))
                .body("items[0].entityId", equalTo(requestId));

        given()
                .header("Authorization", "Bearer " + otherToken)
                .queryParam("entityType", "QUOTE_REQUEST")
                .when()
                .get("/activity-logs")
                .then()
                .statusCode(200)
                .body("totalElements", equalTo(0));

        given()
                .when()
                .post("/public/customer-portal/{token}/quote-requests/{requestId}/cancel", customer.portalToken(), requestId)
                .then()
                .statusCode(200)
                .body("status", equalTo("CANCELLED"));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("type", "QUOTE_REQUEST_CANCELLED")
                .when()
                .get("/notifications")
                .then()
                .statusCode(200)
                .body("totalElements", equalTo(1));
    }

    @Test
    void stockThresholdAndRestockEventsCreateExpectedNotificationsWithoutLowStockSpam() {
        String token = registerAndToken("notifications-stock");
        String productId = createProduct(token, "Produto Critico Notificacao", "STOCK-NOT", "20.00", "25.000", "20.000");

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "7.000",
                        "reason", "Saida para testar limite"
                ))
                .when()
                .post("/stock/outputs")
                .then()
                .statusCode(200)
                .body("previousQuantity", equalTo(25.000F))
                .body("newQuantity", equalTo(18.000F));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "1.000",
                        "reason", "Produto ja estava baixo"
                ))
                .when()
                .post("/stock/outputs")
                .then()
                .statusCode(200);

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("type", "STOCK_LOW")
                .when()
                .get("/notifications")
                .then()
                .statusCode(200)
                .body("totalElements", equalTo(1));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "newQuantity", "0.000",
                        "reason", "Zerar estoque"
                ))
                .when()
                .post("/stock/adjustments")
                .then()
                .statusCode(200)
                .body("newQuantity", equalTo(0.000F));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("type", "STOCK_OUT")
                .when()
                .get("/notifications")
                .then()
                .statusCode(200)
                .body("totalElements", equalTo(1));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "quantity", "5.000",
                        "reason", "Compra fornecedor"
                ))
                .when()
                .post("/stock/replenishment/{productId}/restock", productId)
                .then()
                .statusCode(200);

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("type", "RESTOCK_REGISTERED")
                .when()
                .get("/notifications")
                .then()
                .statusCode(200)
                .body("totalElements", equalTo(1));
    }

    private String registerAndToken(String prefix) {
        String unique = prefix + "-" + Instant.now().toEpochMilli() + "-" + System.nanoTime();
        return given()
                .contentType("application/json")
                .body(Map.of(
                        "companyName", "Empresa " + unique,
                        "ownerName", "Owner " + unique,
                        "email", unique + "@stockflow.test",
                        "password", "password123"
                ))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200)
                .extract()
                .path("token");
    }

    private String createCustomer(String token, String name) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("name", name, "type", "COMPANY"))
                .when()
                .post("/customers")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private CustomerData createCustomerWithPortalToken(String token, String name) {
        String id = createCustomer(token, name);
        String portalToken = given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/customers/{id}", id)
                .then()
                .statusCode(200)
                .body("portalToken", notNullValue())
                .extract()
                .path("portalToken");
        return new CustomerData(id, portalToken);
    }

    private String createProduct(
            String token,
            String name,
            String sku,
            String salePrice,
            String stockQuantity,
            String minimumStock
    ) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "name", name,
                        "sku", sku + "-" + System.nanoTime(),
                        "category", "Teste",
                        "costPrice", "10.00",
                        "salePrice", salePrice,
                        "unit", "UN",
                        "stockQuantity", stockQuantity,
                        "minimumStock", minimumStock
                ))
                .when()
                .post("/products")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private String createQuote(String token, String customerId, String productId) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "customerId", customerId,
                        "discount", "0.00",
                        "shipping", "0.00",
                        "items", List.of(Map.of(
                                "itemType", "PRODUCT",
                                "productId", productId,
                                "quantity", "2.000",
                                "unitPrice", "30.00",
                                "discount", "0.00"
                        ))
                ))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private void sendQuote(String token, String quoteId) {
        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/send", quoteId)
                .then()
                .statusCode(200);
    }

    private String createPublicToken(String token, String quoteId) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/public-token", quoteId)
                .then()
                .statusCode(200)
                .extract()
                .path("token");
    }

    private record CustomerData(String id, String portalToken) {
    }
}
