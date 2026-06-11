package com.stockflow.dashboard;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class DashboardResourceTest {

    @Test
    void returnsSummaryForAuthenticatedCompany() {
        String token = registerAndToken("dashboard-summary");
        String customerId = createCustomer(token, "Cliente Dashboard");
        String lowStockProductId = createProduct(token, "Produto Baixo", "DASH-LOW", "1.000", "5.000", "30.00");
        String outOfStockProductId = createProduct(token, "Produto Zerado", "DASH-ZERO", "0.000", "5.000", "30.00");
        String healthyProductId = createProduct(token, "Produto Saudavel", "DASH-OK", "10.000", "2.000", "30.00");

        String openQuoteId = createQuote(token, customerId, healthyProductId, "1.000");
        String approvedQuoteId = createQuote(token, customerId, healthyProductId, "2.000");
        approveQuote(token, approvedQuoteId);
        createStockEntry(token, lowStockProductId);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("period.dateFrom", notNullValue())
                .body("period.dateTo", notNullValue())
                .body("quotes.total", equalTo(2))
                .body("quotes.approvedByCustomer", equalTo(0))
                .body("quotes.completed", equalTo(1))
                .body("quotes.rejected", equalTo(0))
                .body("quotes.cancelled", equalTo(0))
                .body("quotes.open", equalTo(1))
                .body("quotes.approvedAmount", equalTo(60.0F))
                .body("quotes.openAmount", equalTo(30.0F))
                .body("quotes.approvalRate", equalTo(50.0F))
                .body("stock.lowStockCount", equalTo(2))
                .body("stock.outOfStockCount", equalTo(1))
                .body("customers.total", equalTo(1))
                .body("customers.createdInPeriod", equalTo(1))
                .body("criticalProducts", hasSize(2))
                .body("criticalProducts[0].id", equalTo(outOfStockProductId))
                .body("criticalProducts[0].status", equalTo("OUT_OF_STOCK"))
                .body("recentQuotes", hasSize(2))
                .body("recentQuotes[0].id", notNullValue())
                .body("recentCustomers", hasSize(1))
                .body("recentCustomers[0].name", equalTo("Cliente Dashboard"))
                .body("recentStockMovements", hasSize(2))
                .body("recentStockMovements[0].productName", notNullValue());

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quotes/{id}", openQuoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("DRAFT"));
    }

    @Test
    void requiresAuthenticationAndFiltersByCompany() {
        String firstToken = registerAndToken("dashboard-tenant-a");
        String secondToken = registerAndToken("dashboard-tenant-b");
        String customerId = createCustomer(firstToken, "Cliente Tenant A");
        String productId = createProduct(firstToken, "Produto Tenant A", "DASH-A", "1.000", "5.000", "10.00");
        createQuote(firstToken, customerId, productId, "1.000");

        given()
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(401);

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("quotes.total", equalTo(0))
                .body("quotes.approvedAmount", equalTo(0))
                .body("quotes.openAmount", equalTo(0))
                .body("quotes.approvalRate", equalTo(0.0F))
                .body("stock.lowStockCount", equalTo(0))
                .body("stock.outOfStockCount", equalTo(0))
                .body("criticalProducts", hasSize(0))
                .body("recentQuotes", hasSize(0))
                .body("recentCustomers", hasSize(0))
                .body("recentStockMovements", hasSize(0));
    }

    @Test
    void filtersSupportedPeriods() {
        String token = registerAndToken("dashboard-periods");
        String customerId = createCustomer(token, "Cliente Periodo");
        String productId = createProduct(token, "Produto Periodo", "DASH-PER", "10.000", "2.000", "40.00");
        createQuote(token, customerId, productId, "1.000");

        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("period", "today")
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("period.dateFrom", equalTo(today.toString()))
                .body("period.dateTo", equalTo(today.toString()))
                .body("quotes.total", equalTo(1));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("period", "last7days")
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("period.dateFrom", equalTo(today.minusDays(6).toString()))
                .body("period.dateTo", equalTo(today.toString()))
                .body("quotes.total", equalTo(1));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("period", "previousMonth")
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("quotes.total", equalTo(0));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("period", "custom")
                .queryParam("dateFrom", today.toString())
                .queryParam("dateTo", today.toString())
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("period.dateFrom", equalTo(today.toString()))
                .body("period.dateTo", equalTo(today.toString()))
                .body("quotes.total", equalTo(1));
    }

    @Test
    void rejectsInvalidCustomPeriod() {
        String token = registerAndToken("dashboard-invalid-custom");
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("period", "custom")
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(400);

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("period", "custom")
                .queryParam("dateFrom", today.toString())
                .queryParam("dateTo", today.minusDays(1).toString())
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(400);
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

    private String createProduct(
            String token,
            String name,
            String sku,
            String stockQuantity,
            String minimumStock,
            String salePrice
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

    private String createQuote(String token, String customerId, String productId, String quantity) {
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
                                "quantity", quantity,
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

    private void approveQuote(String token, String quoteId) {
        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/send", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("SENT"));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/approve", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("CUSTOMER_APPROVED"));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/complete", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("COMPLETED"));
    }

    private void createStockEntry(String token, String productId) {
        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "1.000",
                        "reason", "Reposição de teste"
                ))
                .when()
                .post("/stock/entries")
                .then()
                .statusCode(200);
    }
}
