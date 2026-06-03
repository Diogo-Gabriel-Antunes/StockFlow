package com.stockflow.stock;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class StockResourceTest {

    @Test
    void entryOutputAndAdjustmentUpdateStockAndCreateHistory() {
        String token = registerAndToken("stock-flow");
        String productId = createProduct(token, "Produto Estoque", "STK-001", "5.000", "3.000");

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "4.000",
                        "reason", "Entrada manual"
                ))
                .when()
                .post("/stock/entries")
                .then()
                .statusCode(200)
                .body("type", equalTo("IN"))
                .body("previousQuantity", equalTo(5.000F))
                .body("newQuantity", equalTo(9.000F));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "2.000",
                        "reason", "Saida manual"
                ))
                .when()
                .post("/stock/outputs")
                .then()
                .statusCode(200)
                .body("type", equalTo("OUT"))
                .body("previousQuantity", equalTo(9.000F))
                .body("newQuantity", equalTo(7.000F));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "newQuantity", "1.000",
                        "reason", "Ajuste manual"
                ))
                .when()
                .post("/stock/adjustments")
                .then()
                .statusCode(200)
                .body("type", equalTo("ADJUSTMENT"))
                .body("previousQuantity", equalTo(7.000F))
                .body("newQuantity", equalTo(1.000F));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("productId", productId)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("items", hasSize(3))
                .body("total", equalTo(3));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/stock/low")
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(productId))
                .body("[0].suggestedPurchaseQuantity", equalTo(2.000F));
    }

    @Test
    void rejectsNegativeStockAndMissingAuthentication() {
        String token = registerAndToken("stock-negative");
        String productId = createProduct(token, "Produto Negativo", "NEG-001", "1.000", "1.000");

        given()
                .contentType("application/json")
                .body(Map.of(
                        "productId", productId,
                        "quantity", "1.000",
                        "reason", "Sem token"
                ))
                .when()
                .post("/stock/outputs")
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "2.000",
                        "reason", "Saida maior que saldo"
                ))
                .when()
                .post("/stock/outputs")
                .then()
                .statusCode(400);
    }

    @Test
    void rejectsMovementForProductFromAnotherCompany() {
        String firstToken = registerAndToken("stock-tenant-a");
        String secondToken = registerAndToken("stock-tenant-b");
        String productId = createProduct(firstToken, "Produto Tenant A", "STA-001", "5.000", "2.000");

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + secondToken)
                .body(Map.of(
                        "productId", productId,
                        "quantity", "1.000",
                        "reason", "Outro tenant"
                ))
                .when()
                .post("/stock/entries")
                .then()
                .statusCode(404);

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("items", hasSize(0))
                .body("total", equalTo(0));
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
                        "sku", sku,
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
