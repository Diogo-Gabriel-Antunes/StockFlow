package com.stockflow.services;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class ServiceItemResourceTest {

    @Test
    void serviceCrudUsesAuthenticatedCompany() {
        String token = registerAndToken("services-crud");

        String id = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(service("Banho e Tosa", "80.00"))
                .when()
                .post("/services")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Banho e Tosa"))
                .body("active", equalTo(true))
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("search", "banho")
                .when()
                .get("/services")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(id))
                .body("total", equalTo(1));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(service("Tosa Higienica", "95.00"))
                .when()
                .put("/services/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Tosa Higienica"));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .delete("/services/{id}", id)
                .then()
                .statusCode(204);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/services/{id}", id)
                .then()
                .statusCode(404);
    }

    @Test
    void validatesServicePriceAndTenantIsolation() {
        String firstToken = registerAndToken("services-tenant-a");
        String secondToken = registerAndToken("services-tenant-b");

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + firstToken)
                .body(service("Servico Invalido", "-1.00"))
                .when()
                .post("/services")
                .then()
                .statusCode(400);

        String id = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + firstToken)
                .body(service("Servico Tenant A", "50.00"))
                .when()
                .post("/services")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/services/{id}", id)
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

    private Map<String, Object> service(String name, String defaultPrice) {
        return Map.of(
                "name", name,
                "description", "Servico de teste",
                "defaultPrice", defaultPrice,
                "estimatedCost", "15.00"
        );
    }
}
