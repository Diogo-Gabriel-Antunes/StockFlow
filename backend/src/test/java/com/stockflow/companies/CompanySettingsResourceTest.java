package com.stockflow.companies;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class CompanySettingsResourceTest {

    @Test
    void getRequiresAuthenticationAndReturnsCurrentCompanySettings() {
        String token = registerAndToken("company-settings-get");

        given()
                .when()
                .get("/company/settings")
                .then()
                .statusCode(401);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/company/settings")
                .then()
                .statusCode(200)
                .body("tradeName", equalTo("Empresa company-settings-get"))
                .body("legalName", nullValue())
                .body("defaultQuoteValidityDays", nullValue());
    }

    @Test
    void updateOnlyChangesAuthenticatedCompany() {
        String firstToken = registerAndToken("company-settings-a");
        String secondToken = registerAndToken("company-settings-b");

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + firstToken)
                .body(settings("Loja A", "loja-a@stockflow.test", "SC", 7))
                .when()
                .put("/company/settings")
                .then()
                .statusCode(200)
                .body("tradeName", equalTo("Loja A"))
                .body("email", equalTo("loja-a@stockflow.test"))
                .body("state", equalTo("SC"))
                .body("defaultQuoteValidityDays", equalTo(7));

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/company/settings")
                .then()
                .statusCode(200)
                .body("tradeName", equalTo("Empresa company-settings-b"))
                .body("email", nullValue())
                .body("defaultQuoteValidityDays", nullValue());
    }

    @Test
    void rejectsInvalidSettings() {
        String token = registerAndToken("company-settings-invalid");

        given()
                .contentType("application/json")
                .body(settings("Loja", "email-invalido", "SC", 7))
                .when()
                .put("/company/settings")
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(settings("Loja", "email-invalido", "SC", 7))
                .when()
                .put("/company/settings")
                .then()
                .statusCode(400);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(settings("Loja", "loja@stockflow.test", "SCC", 7))
                .when()
                .put("/company/settings")
                .then()
                .statusCode(400);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(settings("Loja", "loja@stockflow.test", "SC", 0))
                .when()
                .put("/company/settings")
                .then()
                .statusCode(400);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(settings("Loja", "loja@stockflow.test", "SC", 366))
                .when()
                .put("/company/settings")
                .then()
                .statusCode(400);
    }

    private String registerAndToken(String prefix) {
        String unique = prefix + "-" + Instant.now().toEpochMilli() + "-" + System.nanoTime();
        return given()
                .contentType("application/json")
                .body(Map.of(
                        "companyName", "Empresa " + prefix,
                        "ownerName", "Owner " + prefix,
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

    private Map<String, Object> settings(String tradeName, String email, String state, int validityDays) {
        Map<String, Object> body = new HashMap<>();
        body.put("companyId", "not-accepted");
        body.put("tradeName", tradeName);
        body.put("legalName", tradeName + " LTDA");
        body.put("document", "12.345.678/0001-90");
        body.put("email", email);
        body.put("phone", "(47) 3333-3333");
        body.put("whatsapp", "(47) 99999-9999");
        body.put("address", "Rua Exemplo");
        body.put("addressNumber", "123");
        body.put("addressComplement", "Sala 2");
        body.put("neighborhood", "Centro");
        body.put("city", "Joinville");
        body.put("state", state);
        body.put("zipCode", "89200-000");
        body.put("defaultQuoteNotes", "Observação padrão");
        body.put("defaultPaymentTerms", "Pagamento padrão");
        body.put("defaultQuoteValidityDays", validityDays);
        return body;
    }
}
