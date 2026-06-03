package com.stockflow.customers;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class CustomerResourceTest {

    @Test
    void customerCrudUsesAuthenticatedCompany() {
        String token = registerAndToken("customers-crud");

        String id = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(customer("Cliente Teste", "PERSON"))
                .when()
                .post("/customers")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("name", equalTo("Cliente Teste"))
                .body("type", equalTo("PERSON"))
                .body("active", equalTo(true))
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("search", "teste")
                .when()
                .get("/customers")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(id))
                .body("total", equalTo(1));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/customers/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Cliente Teste"));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(customer("Cliente Atualizado", "COMPANY"))
                .when()
                .put("/customers/{id}", id)
                .then()
                .statusCode(200)
                .body("name", equalTo("Cliente Atualizado"))
                .body("type", equalTo("COMPANY"));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .delete("/customers/{id}", id)
                .then()
                .statusCode(204);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/customers/{id}", id)
                .then()
                .statusCode(404);
    }

    @Test
    void validatesRequiredFieldsAndAuthentication() {
        String token = registerAndToken("customers-validation");

        given()
                .contentType("application/json")
                .body(customer("Cliente Sem Token", "PERSON"))
                .when()
                .post("/customers")
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("type", "PERSON"))
                .when()
                .post("/customers")
                .then()
                .statusCode(400);
    }

    @Test
    void rejectsAccessToCustomerFromAnotherCompany() {
        String firstToken = registerAndToken("customers-tenant-a");
        String secondToken = registerAndToken("customers-tenant-b");

        String id = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + firstToken)
                .body(customer("Cliente Tenant A", "PERSON"))
                .when()
                .post("/customers")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/customers/{id}", id)
                .then()
                .statusCode(404);

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/customers")
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

    private Map<String, Object> customer(String name, String type) {
        return Map.of(
                "name", name,
                "type", type,
                "document", "12345678900",
                "email", "cliente@stockflow.test",
                "phone", "1133334444",
                "whatsapp", "11999998888",
                "city", "Sao Paulo",
                "state", "SP",
                "notes", "Cliente de teste"
        );
    }
}
