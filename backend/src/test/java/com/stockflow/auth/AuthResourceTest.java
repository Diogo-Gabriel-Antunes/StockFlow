package com.stockflow.auth;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class AuthResourceTest {

    @Test
    void registerLoginAndMeUseTheSameAuthenticatedTenant() {
        String email = "owner-" + Instant.now().toEpochMilli() + "@stockflow.test";

        String token = given()
                .contentType("application/json")
                .body(Map.of(
                        "companyName", "Empresa Teste Auth",
                        "ownerName", "Owner Teste",
                        "email", email,
                        "password", "password123"
                ))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .body("user.role", equalTo("OWNER"))
                .body("company.name", equalTo("Empresa Teste Auth"))
                .extract()
                .path("token");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/auth/me")
                .then()
                .statusCode(200)
                .body("user.email", equalTo(email))
                .body("company.name", equalTo("Empresa Teste Auth"));

        given()
                .contentType("application/json")
                .body(Map.of(
                        "email", email,
                        "password", "password123"
                ))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .body("user.email", equalTo(email));
    }

    @Test
    void meRejectsMissingToken() {
        given()
                .when()
                .get("/auth/me")
                .then()
                .statusCode(401);
    }
}
