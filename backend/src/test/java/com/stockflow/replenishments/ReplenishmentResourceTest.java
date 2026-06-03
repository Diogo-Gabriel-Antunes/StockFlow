package com.stockflow.replenishments;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class ReplenishmentResourceTest {

    @Test
    void listsCriticalProductsAndRegistersReplenishmentEntry() {
        String token = registerAndToken("replenishment-flow");
        String criticalProductId = createProduct(token, "Produto Critico", "REP-001", "1.000", "5.000");
        createProduct(token, "Produto Saudavel", "REP-002", "10.000", "5.000");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/replenishments")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(criticalProductId))
                .body("[0].suggestedPurchaseQuantity", equalTo(4.000F));

        String replenishmentId = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", criticalProductId,
                        "quantity", "4.000",
                        "reason", "Compra fornecedor"
                ))
                .when()
                .post("/replenishments/entries")
                .then()
                .statusCode(200)
                .body("replenishmentId", notNullValue())
                .body("movement.type", equalTo("IN"))
                .body("movement.previousQuantity", equalTo(1.000F))
                .body("movement.newQuantity", equalTo(5.000F))
                .body("movement.referenceType", equalTo("REPLENISHMENT"))
                .extract()
                .path("replenishmentId");

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("productId", criticalProductId)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("total", equalTo(1))
                .body("items[0].referenceType", equalTo("REPLENISHMENT"))
                .body("items[0].referenceId", equalTo(replenishmentId));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/replenishments")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(criticalProductId))
                .body("[0].suggestedPurchaseQuantity", equalTo(0.000F));
    }

    @Test
    void validatesAuthenticationAndTenantIsolation() {
        String firstToken = registerAndToken("replenishment-tenant-a");
        String secondToken = registerAndToken("replenishment-tenant-b");
        String productId = createProduct(firstToken, "Produto Tenant A", "REP-A", "1.000", "5.000");

        given()
                .when()
                .get("/replenishments")
                .then()
                .statusCode(401);

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/replenishments")
                .then()
                .statusCode(200)
                .body("", hasSize(0));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + secondToken)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "1.000"
                ))
                .when()
                .post("/replenishments/entries")
                .then()
                .statusCode(404);
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
