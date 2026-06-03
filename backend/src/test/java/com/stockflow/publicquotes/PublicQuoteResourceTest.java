package com.stockflow.publicquotes;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class PublicQuoteResourceTest {

    @Test
    void publicQuoteCanBeViewedApprovedOnceAndDownloadedAsPdfWithoutLogin() {
        String token = registerAndToken("public-quotes");
        String customerId = createCustomer(token, "Cliente Publico");
        String productId = createProduct(token, "Produto Publico", "PUB-1", "40.00", "10.000");
        String serviceId = createService(token, "Servico Publico", "80.00");
        String quoteId = createQuote(token, customerId, productId, serviceId, LocalDate.now().plusDays(7).toString());

        String publicToken = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/public-token", quoteId)
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .body("url", containsString("/public/quotes/"))
                .extract()
                .path("token");

        given()
                .when()
                .get("/public/quotes/{token}", publicToken)
                .then()
                .statusCode(200)
                .body("code", notNullValue())
                .body("companyName", notNullValue())
                .body("customerName", equalTo("Cliente Publico"))
                .body("items.size()", equalTo(2));

        given()
                .when()
                .get("/public/quotes/{token}/pdf", publicToken)
                .then()
                .statusCode(200)
                .contentType("application/pdf")
                .body(containsString("%PDF-1.4"));

        given()
                .contentType("application/json")
                .when()
                .post("/public/quotes/{token}/approve", publicToken)
                .then()
                .statusCode(200)
                .body("status", equalTo("APPROVED"));

        given()
                .contentType("application/json")
                .when()
                .post("/public/quotes/{token}/approve", publicToken)
                .then()
                .statusCode(200)
                .body("status", equalTo("APPROVED"));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(7.0F));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("productId", productId)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("total", equalTo(1))
                .body("items[0].type", equalTo("SALE"))
                .body("items[0].referenceId", equalTo(quoteId));
    }

    @Test
    void publicQuoteCanBeRejectedAndExpiredLinkCannotBeApproved() {
        String token = registerAndToken("public-quotes-expired");
        String customerId = createCustomer(token, "Cliente Expirado");
        String productId = createProduct(token, "Produto Expirado", "PUB-2", "25.00", "5.000");
        String quoteId = createQuote(token, customerId, productId, null, LocalDate.now().minusDays(1).toString());

        String publicToken = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/public-token", quoteId)
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        given()
                .contentType("application/json")
                .when()
                .post("/public/quotes/{token}/approve", publicToken)
                .then()
                .statusCode(400);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quotes/{id}", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("EXPIRED"));

        String activeQuoteId = createQuote(token, customerId, productId, null, LocalDate.now().plusDays(2).toString());
        String activePublicToken = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/public-token", activeQuoteId)
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        given()
                .contentType("application/json")
                .when()
                .post("/public/quotes/{token}/reject", activePublicToken)
                .then()
                .statusCode(200)
                .body("status", equalTo("REJECTED"));
    }

    @Test
    void authenticatedQuotePdfRequiresToken() {
        String token = registerAndToken("quote-pdf");
        String customerId = createCustomer(token, "Cliente PDF");
        String productId = createProduct(token, "Produto PDF", "PUB-3", "30.00", "5.000");
        String quoteId = createQuote(token, customerId, productId, null, null);

        given()
                .when()
                .get("/quotes/{id}/pdf", quoteId)
                .then()
                .statusCode(401);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quotes/{id}/pdf", quoteId)
                .then()
                .statusCode(200)
                .contentType("application/pdf")
                .body(containsString("%PDF-1.4"));
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

    private String createProduct(String token, String name, String sku, String salePrice, String stockQuantity) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "name", name,
                        "sku", sku + "-" + System.nanoTime(),
                        "category", "Pet",
                        "costPrice", "10.00",
                        "salePrice", salePrice,
                        "unit", "UN",
                        "stockQuantity", stockQuantity,
                        "minimumStock", "2.000"
                ))
                .when()
                .post("/products")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private String createService(String token, String name, String defaultPrice) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "name", name,
                        "description", "Servico",
                        "defaultPrice", defaultPrice,
                        "estimatedCost", "20.00"
                ))
                .when()
                .post("/services")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private String createQuote(String token, String customerId, String productId, String serviceId, String validUntil) {
        Map<String, Object> body = quote(customerId, productId, serviceId, validUntil);
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(body)
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .body("total", greaterThan(0.0F))
                .extract()
                .path("id");
    }

    private Map<String, Object> quote(String customerId, String productId, String serviceId, String validUntil) {
        List<Map<String, Object>> items = serviceId == null
                ? List.of(Map.of(
                        "itemType", "PRODUCT",
                        "productId", productId,
                        "quantity", "3.000",
                        "unitPrice", "25.00",
                        "discount", "0.00"
                ))
                : List.of(
                        Map.of(
                                "itemType", "PRODUCT",
                                "productId", productId,
                                "quantity", "3.000",
                                "unitPrice", "40.00",
                                "discount", "0.00"
                        ),
                        Map.of(
                                "itemType", "SERVICE",
                                "serviceId", serviceId,
                                "quantity", "1.000",
                                "unitPrice", "80.00",
                                "discount", "0.00"
                        )
                );
        if (validUntil == null) {
            return Map.of(
                    "customerId", customerId,
                    "discount", "0.00",
                    "shipping", "0.00",
                    "items", items
            );
        }
        return Map.of(
                "customerId", customerId,
                "validUntil", validUntil,
                "discount", "0.00",
                "shipping", "0.00",
                "items", items
        );
    }
}
