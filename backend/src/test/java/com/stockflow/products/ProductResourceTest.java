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
                .body("total", equalTo(1));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(product("Racao Atualizada", "PET-002", "109.90"))
                .when()
                .put("/products/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Racao Atualizada"))
                .body("sku", equalTo("PET-002"));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .delete("/products/{id}", id)
                .then()
                .statusCode(204);

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
