package com.stockflow.replenishments;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

@QuarkusTest
class ReplenishmentResourceTest {

    @Test
    void listsOnlyActiveCriticalProductsWithSuggestionsAndStatus() {
        String token = registerAndToken("replenishment-list");
        createProduct(token, "Produto Saudavel", "REP-OK", "50.000", "10.000");
        String equalProductId = createProduct(token, "Produto Igual", "REP-EQ", "10.000", "10.000");
        String lowProductId = createProduct(token, "Produto Baixo", "REP-LOW", "8.000", "20.000");
        String zeroProductId = createProduct(token, "Produto Zerado", "REP-ZERO", "0.000", "10.000");
        String inactiveProductId = createProduct(token, "Produto Inativo", "REP-INACTIVE", "0.000", "10.000");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .delete("/products/{id}", inactiveProductId)
                .then()
                .statusCode(204);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/stock/replenishment")
                .then()
                .statusCode(200)
                .body("items", hasSize(3))
                .body("totalElements", equalTo(3))
                .body("totalPages", equalTo(1))
                .body("items[0].id", equalTo(zeroProductId))
                .body("items[0].productId", equalTo(zeroProductId))
                .body("items[0].suggestedQuantity", equalTo(10.000F))
                .body("items[0].suggestedPurchaseQuantity", equalTo(10.000F))
                .body("items[0].status", equalTo("OUT_OF_STOCK"))
                .body("items[1].id", equalTo(lowProductId))
                .body("items[1].suggestedQuantity", equalTo(12.000F))
                .body("items[1].status", equalTo("LOW_STOCK"))
                .body("items[2].id", equalTo(equalProductId))
                .body("items[2].suggestedQuantity", equalTo(1));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("search", "REP-LOW")
                .queryParam("status", "LOW_STOCK")
                .queryParam("size", 1)
                .when()
                .get("/stock/replenishment")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(lowProductId))
                .body("totalElements", equalTo(1));
    }

    @Test
    void productFromAnotherCompanyDoesNotAppear() {
        String firstToken = registerAndToken("replenishment-tenant-a");
        String secondToken = registerAndToken("replenishment-tenant-b");
        createProduct(firstToken, "Produto Tenant A", "REP-A", "1.000", "5.000");

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/stock/replenishment")
                .then()
                .statusCode(200)
                .body("items", hasSize(0))
                .body("totalElements", equalTo(0));
    }

    @Test
    void restockAddsStockAndCreatesReferencedMovement() {
        String token = registerAndToken("replenishment-flow");
        String productId = createProduct(token, "Produto Critico", "REP-001", "8.000", "20.000");

        String replenishmentId = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "quantity", "12.000",
                        "reason", "Compra fornecedor"
                ))
                .when()
                .post("/stock/replenishment/{productId}/restock", productId)
                .then()
                .statusCode(200)
                .body("replenishmentId", notNullValue())
                .body("movement.type", equalTo("IN"))
                .body("movement.quantity", equalTo(12.000F))
                .body("movement.previousQuantity", equalTo(8.000F))
                .body("movement.newQuantity", equalTo(20.000F))
                .body("movement.reason", equalTo("Compra fornecedor"))
                .body("movement.referenceType", equalTo("REPLENISHMENT"))
                .extract()
                .path("replenishmentId");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(20.000F));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("productId", productId)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("total", equalTo(1))
                .body("items[0].referenceType", equalTo("REPLENISHMENT"))
                .body("items[0].referenceId", equalTo(replenishmentId));
    }

    @Test
    void validatesRestockQuantityAndProductExistence() {
        String token = registerAndToken("replenishment-validation");
        String productId = createProduct(token, "Produto Validacao", "REP-VAL", "1.000", "5.000");

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("quantity", "0.000"))
                .when()
                .post("/stock/replenishment/{productId}/restock", productId)
                .then()
                .statusCode(400);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("quantity", "-1.000"))
                .when()
                .post("/stock/replenishment/{productId}/restock", productId)
                .then()
                .statusCode(400);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("quantity", "1.000"))
                .when()
                .post("/stock/replenishment/{productId}/restock", UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void validatesAuthenticationAndTenantIsolationOnRestock() {
        String firstToken = registerAndToken("replenishment-restock-a");
        String secondToken = registerAndToken("replenishment-restock-b");
        String productId = createProduct(firstToken, "Produto Tenant A", "REP-A", "1.000", "5.000");

        given()
                .when()
                .get("/stock/replenishment")
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .body(Map.of("quantity", "1.000"))
                .when()
                .post("/stock/replenishment/{productId}/restock", productId)
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + secondToken)
                .body(Map.of("quantity", "1.000"))
                .when()
                .post("/stock/replenishment/{productId}/restock", productId)
                .then()
                .statusCode(404);

        given()
                .header("Authorization", "Bearer " + firstToken)
                .when()
                .get("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(1.000F));

        given()
                .header("Authorization", "Bearer " + firstToken)
                .queryParam("productId", productId)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("total", equalTo(0));
    }

    @Test
    void legacyReplenishmentEndpointsRemainCompatible() {
        String token = registerAndToken("replenishment-legacy");
        String productId = createProduct(token, "Produto Legado", "REP-LEG", "1.000", "5.000");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/replenishments")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(productId));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "4.000"
                ))
                .when()
                .post("/replenishments/entries")
                .then()
                .statusCode(200)
                .body("movement.type", equalTo("IN"))
                .body("movement.referenceType", equalTo("REPLENISHMENT"));
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

    private String createProduct(String token, String name, String sku, String stockQuantity, String minimumStock) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "name", name,
                        "sku", sku + "-" + System.nanoTime(),
                        "barcode", "789" + System.nanoTime(),
                        "referenceCode", "REF-" + System.nanoTime(),
                        "category", "Teste",
                        "costPrice", "10.00",
                        "salePrice", "20.00",
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
}
