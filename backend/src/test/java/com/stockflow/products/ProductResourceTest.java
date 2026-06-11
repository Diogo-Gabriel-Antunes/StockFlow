package com.stockflow.products;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class ProductResourceTest {

    @Test
    void productCrudUsesAuthenticatedCompany() {
        String token = registerAndToken("products-crud");

        String id = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(product("Racao Premium", "PET-001", "99.90"))
                .when()
                .post("/products")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Racao Premium"))
                .body("sku", equalTo("PET-001"))
                .body("barcode", equalTo("7891000000010"))
                .body("referenceCode", equalTo("REF-PET-001"))
                .body("active", equalTo(true))
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("search", "PET-001")
                .when()
                .get("/products")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(id))
                .body("total", equalTo(1))
                .body("totalElements", equalTo(1))
                .body("totalPages", equalTo(1));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("search", "7891000000010")
                .when()
                .get("/products")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(id))
                .body("total", equalTo(1));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("search", "REF-PET-001")
                .when()
                .get("/products")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(id))
                .body("total", equalTo(1));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(productWithoutCodes("Racao Atualizada", "PET-002", "109.90"))
                .when()
                .put("/products/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Racao Atualizada"))
                .body("sku", equalTo("PET-002"))
                .body("barcode", equalTo(null))
                .body("referenceCode", equalTo(null));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .delete("/products/{id}", id)
                .then()
                .statusCode(204);

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("active", false)
                .when()
                .get("/products")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(id));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/{id}", id)
                .then()
                .statusCode(404);
    }

    @Test
    void validatesProductPriceAndAuthentication() {
        String token = registerAndToken("products-validation");

        given()
                .contentType("application/json")
                .body(product("Produto Sem Token", "NOAUTH", "10.00"))
                .when()
                .post("/products")
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(product("Produto Invalido", "BAD", "-1.00"))
                .when()
                .post("/products")
                .then()
                .statusCode(400);
    }

    @Test
    void rejectsAccessToProductFromAnotherCompany() {
        String firstToken = registerAndToken("products-tenant-a");
        String secondToken = registerAndToken("products-tenant-b");

        String id = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + firstToken)
                .body(product("Produto Tenant A", "TENANT-A", "25.00"))
                .when()
                .post("/products")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/products/{id}", id)
                .then()
                .statusCode(404);

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/products")
                .then()
                .statusCode(200)
                .body("items", hasSize(0))
                .body("total", equalTo(0));
    }

    @Test
    void filtersLowStockAndPaginatesProducts() {
        String token = registerAndToken("products-pagination");
        String firstId = createProduct(token, product("Produto Critico A", "LOW-A", "20.00", "1.000", "5.000"));
        createProduct(token, product("Produto Critico B", "LOW-B", "20.00", "2.000", "5.000"));
        createProduct(token, product("Produto Saudavel", "OK-A", "20.00", "10.000", "5.000"));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("lowStock", true)
                .queryParam("size", 1)
                .queryParam("sort", "name")
                .queryParam("direction", "asc")
                .when()
                .get("/products")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(firstId))
                .body("totalElements", equalTo(2))
                .body("totalPages", equalTo(2))
                .body("first", equalTo(true))
                .body("last", equalTo(false));
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

    private Map<String, Object> product(String name, String sku, String salePrice) {
        return product(name, sku, salePrice, "10.000", "2.000");
    }

    private String createProduct(String token, Map<String, Object> product) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(product)
                .when()
                .post("/products")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private Map<String, Object> product(String name, String sku, String salePrice, String stockQuantity, String minimumStock) {
        return Map.of(
                "name", name,
                "sku", sku,
                "category", "Pet",
                "barcode", "7891000000010",
                "referenceCode", "REF-PET-001",
                "costPrice", "12.50",
                "salePrice", salePrice,
                "unit", "UN",
                "stockQuantity", stockQuantity,
                "minimumStock", minimumStock
        );
    }

    private Map<String, Object> productWithoutCodes(String name, String sku, String salePrice) {
        return Map.of(
                "name", name,
                "sku", sku,
                "category", "Pet",
                "costPrice", "12.50",
                "salePrice", salePrice,
                "unit", "UN",
                "stockQuantity", "10.000",
                "minimumStock", "2.000"
        );
    }
}
