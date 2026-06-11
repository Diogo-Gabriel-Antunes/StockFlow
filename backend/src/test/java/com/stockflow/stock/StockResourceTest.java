package com.stockflow.stock;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
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
                .body("quantity", equalTo(4.000F))
                .body("previousQuantity", equalTo(5.000F))
                .body("newQuantity", equalTo(9.000F))
                .body("createdByName", notNullValue());

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
                .body("quantity", equalTo(2.000F))
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
                .body("quantity", equalTo(6.000F))
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
                .get("/stock/movements/product/" + productId)
                .then()
                .statusCode(200)
                .body("items", hasSize(3))
                .body("items[0].productId", equalTo(productId))
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

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/" + productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(1.000F));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("productId", productId)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("items", hasSize(0))
                .body("total", equalTo(0));
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

    @Test
    void adjustmentToZeroIsAllowedAndInvalidQuantitiesFail() {
        String token = registerAndToken("stock-validation");
        String productId = createProduct(token, "Produto Validacao", "VAL-001", "10.000", "1.000");

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
                .body("type", equalTo("ADJUSTMENT"))
                .body("previousQuantity", equalTo(10.000F))
                .body("newQuantity", equalTo(0.000F));

        assertMovementValidationFails(token, "/stock/entries", Map.of(
                "productId", productId,
                "quantity", "0.000"
        ));
        assertMovementValidationFails(token, "/stock/entries", Map.of(
                "productId", productId,
                "quantity", "-1.000"
        ));
        assertMovementValidationFails(token, "/stock/outputs", Map.of(
                "productId", productId,
                "quantity", "0.000"
        ));
        assertMovementValidationFails(token, "/stock/outputs", Map.of(
                "productId", productId,
                "quantity", "-1.000"
        ));
        assertMovementValidationFails(token, "/stock/adjustments", Map.of(
                "productId", productId,
                "newQuantity", "-1.000"
        ));
        assertMovementValidationFails(token, "/stock/entries", Map.of(
                "quantity", "1.000"
        ));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", UUID.randomUUID().toString(),
                        "quantity", "1.000"
                ))
                .when()
                .post("/stock/entries")
                .then()
                .statusCode(404);
    }

    @Test
    void listMovementsOnlyCurrentCompanyAndProductRouteOnlySelectedProduct() {
        String firstToken = registerAndToken("stock-list-a");
        String secondToken = registerAndToken("stock-list-b");
        String firstProductId = createProduct(firstToken, "Produto Lista A1", "LSTA-001", "5.000", "1.000");
        String secondProductId = createProduct(firstToken, "Produto Lista A2", "LSTA-002", "5.000", "1.000");
        String otherCompanyProductId = createProduct(secondToken, "Produto Lista B", "LSTB-001", "5.000", "1.000");

        createEntry(firstToken, firstProductId, "1.000", "Empresa A produto 1");
        createEntry(firstToken, secondProductId, "2.000", "Empresa A produto 2");
        createEntry(secondToken, otherCompanyProductId, "3.000", "Empresa B");

        given()
                .header("Authorization", "Bearer " + firstToken)
                .queryParam("search", "produto lista a1")
                .queryParam("type", "IN")
                .queryParam("size", 1)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].productId", equalTo(firstProductId))
                .body("totalElements", equalTo(1))
                .body("totalPages", equalTo(1));

        given()
                .header("Authorization", "Bearer " + firstToken)
                .when()
                .get("/stock/movements/product/" + firstProductId)
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].productId", equalTo(firstProductId))
                .body("items[0].reason", equalTo("Empresa A produto 1"))
                .body("total", equalTo(1));

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/stock/movements/product/" + firstProductId)
                .then()
                .statusCode(404);
    }

    @Test
    void lowStockListsOnlyActiveProductsFromCurrentCompanyOrderedByCriticality() {
        String token = registerAndToken("stock-low");
        String otherToken = registerAndToken("stock-low-other");

        createProduct(token, "Produto Saudavel", "OK-001", "50.000", "10.000");
        String equalProductId = createProduct(token, "Produto Igual", "EQ-001", "10.000", "10.000");
        String lowProductId = createProduct(token, "Produto Baixo", "LOW-001", "5.000", "10.000");
        String zeroProductId = createProductWithCodes(token, "Produto Zerado", "ZERO-001", "0.000", "10.000", "7891234567890", "REF-ZERO");
        String inactiveProductId = createProduct(token, "Produto Inativo", "OFF-001", "1.000", "10.000");
        createProduct(otherToken, "Produto Outro Tenant", "OTHER-001", "0.000", "10.000");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .delete("/products/" + inactiveProductId)
                .then()
                .statusCode(204);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/stock/low")
                .then()
                .statusCode(200)
                .body("", hasSize(3))
                .body("[0].id", equalTo(zeroProductId))
                .body("[0].stockStatus", equalTo("OUT_OF_STOCK"))
                .body("[0].barcode", equalTo("7891234567890"))
                .body("[0].referenceCode", equalTo("REF-ZERO"))
                .body("[1].id", equalTo(lowProductId))
                .body("[1].stockStatus", equalTo("LOW_STOCK"))
                .body("[2].id", equalTo(equalProductId))
                .body("[2].stockStatus", equalTo("LOW_STOCK"));
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

    private void assertMovementValidationFails(String token, String path, Map<String, String> body) {
        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(body)
                .when()
                .post(path)
                .then()
                .statusCode(400);
    }

    private void createEntry(String token, String productId, String quantity, String reason) {
        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "productId", productId,
                        "quantity", quantity,
                        "reason", reason
                ))
                .when()
                .post("/stock/entries")
                .then()
                .statusCode(200);
    }

    private String createProduct(String token, String name, String sku, String stockQuantity, String minimumStock) {
        return createProductWithCodes(token, name, sku, stockQuantity, minimumStock, null, null);
    }

    private String createProductWithCodes(
            String token,
            String name,
            String sku,
            String stockQuantity,
            String minimumStock,
            String barcode,
            String referenceCode
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("sku", sku);
        body.put("category", "Teste");
        body.put("costPrice", "10.00");
        body.put("salePrice", "20.00");
        body.put("unit", "UN");
        body.put("stockQuantity", stockQuantity);
        body.put("minimumStock", minimumStock);
        if (barcode != null) {
            body.put("barcode", barcode);
        }
        if (referenceCode != null) {
            body.put("referenceCode", referenceCode);
        }

        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(body)
                .when()
                .post("/products")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }
}
