package com.stockflow.dashboard;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
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
        String healthyProductId = createProduct(token, "Produto Saudavel", "DASH-OK", "10.000", "2.000", "30.00");

        String openQuoteId = createQuote(token, customerId, healthyProductId, "1.000");
        String approvedQuoteId = createQuote(token, customerId, healthyProductId, "2.000");
        approveQuote(token, approvedQuoteId);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/dashboard/summary")
                .then()
                .statusCode(200)
                .body("totalQuotesMonth", equalTo(2))
                .body("approvedValueMonth", equalTo(60.0F))
                .body("openValue", equalTo(30.0F))
                .body("approvalRate", equalTo(50.0F))
                .body("lowStockProductCount", equalTo(1))
                .body("lowStockProducts", hasSize(1))
                .body("lowStockProducts[0].id", equalTo(lowStockProductId))
                .body("lowStockProducts[0].suggestedPurchaseQuantity", equalTo(4.000F))
                .body("recentQuotes", hasSize(2))
                .body("recentQuotes[0].id", notNullValue())
                .body("recentCustomers", hasSize(1))
                .body("recentCustomers[0].name", equalTo("Cliente Dashboard"));

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
                .body("totalQuotesMonth", equalTo(0))
                .body("approvedValueMonth", equalTo(0))
                .body("openValue", equalTo(0))
                .body("approvalRate", equalTo(0.0F))
                .body("lowStockProductCount", equalTo(0))
                .body("lowStockProducts", hasSize(0))
                .body("recentQuotes", hasSize(0))
                .body("recentCustomers", hasSize(0));
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
                .post("/quotes/{id}/approve", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("APPROVED"));
    }
}
