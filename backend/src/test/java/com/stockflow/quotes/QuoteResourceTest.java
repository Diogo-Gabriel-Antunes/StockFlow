package com.stockflow.quotes;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

@QuarkusTest
class QuoteResourceTest {

    @Test
    void createsUpdatesAndChangesQuoteStatusWithCalculatedTotals() {
        String token = registerAndToken("quotes-crud");
        String customerId = createCustomer(token, "Cliente Orcamento");
        String productId = createProduct(token, "Produto Orcamento", "P-Q1", "30.00");
        String serviceId = createService(token, "Servico Orcamento", "80.00");

        String quoteId = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(quote(customerId, productId, serviceId, "5.00", "12.00"))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("status", equalTo("DRAFT"))
                .body("customerId", equalTo(customerId))
                .body("items", hasSize(2))
                .body("subtotal", equalTo(135.0F))
                .body("discount", equalTo(5.0F))
                .body("shipping", equalTo(12.0F))
                .body("total", equalTo(142.0F))
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quotes")
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(quoteId))
                .body("total", equalTo(1));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(quote(customerId, productId, serviceId, "10.00", "0.00"))
                .when()
                .put("/quotes/{id}", quoteId)
                .then()
                .statusCode(200)
                .body("total", equalTo(125.0F));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/send", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("SENT"));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/approve", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("APPROVED"));
    }

    @Test
    void validatesItemsAuthenticationAndDiscounts() {
        String token = registerAndToken("quotes-validation");
        String customerId = createCustomer(token, "Cliente Validacao");
        String productId = createProduct(token, "Produto Validacao", "P-Q2", "15.00");

        given()
                .contentType("application/json")
                .body(quote(customerId, productId, null, "0.00", "0.00"))
                .when()
                .post("/quotes")
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "customerId", customerId,
                        "discount", "0.00",
                        "shipping", "0.00",
                        "items", List.of()
                ))
                .when()
                .post("/quotes")
                .then()
                .statusCode(400);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "customerId", customerId,
                        "discount", "0.00",
                        "shipping", "0.00",
                        "items", List.of(Map.of(
                                "itemType", "PRODUCT",
                                "productId", productId,
                                "quantity", "1.000",
                                "unitPrice", "10.00",
                                "discount", "11.00"
                        ))
                ))
                .when()
                .post("/quotes")
                .then()
                .statusCode(400);
    }

    @Test
    void rejectsAccessToQuoteFromAnotherCompany() {
        String firstToken = registerAndToken("quotes-tenant-a");
        String secondToken = registerAndToken("quotes-tenant-b");
        String customerId = createCustomer(firstToken, "Cliente Tenant A");
        String productId = createProduct(firstToken, "Produto Tenant A", "P-Q3", "20.00");

        String quoteId = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + firstToken)
                .body(quote(customerId, productId, null, "0.00", "0.00"))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/quotes/{id}", quoteId)
                .then()
                .statusCode(404);

        given()
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .get("/quotes")
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

    private String createCustomer(String token, String name) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("name", name, "type", "COMPANY"))
                .when()
                .post("/customers")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private String createProduct(String token, String name, String sku, String salePrice) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "name", name,
                        "sku", sku,
                        "category", "Pet",
                        "costPrice", "10.00",
                        "salePrice", salePrice,
                        "unit", "UN",
                        "stockQuantity", "10.000",
                        "minimumStock", "2.000"
                ))
                .when()
                .post("/products")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private String createService(String token, String name, String defaultPrice) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "name", name,
                        "description", "Servico",
                        "defaultPrice", defaultPrice,
                        "estimatedCost", "20.00"
                ))
                .when()
                .post("/services")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private Map<String, Object> quote(String customerId, String productId, String serviceId, String discount, String shipping) {
        if (serviceId == null) {
            return Map.of(
                    "customerId", customerId,
                    "discount", discount,
                    "shipping", shipping,
                    "notes", "Observacao",
                    "paymentTerms", "Pix",
                    "items", List.of(Map.of(
                            "itemType", "PRODUCT",
                            "productId", productId,
                            "quantity", "2.000",
                            "unitPrice", "30.00",
                            "discount", "0.00"
                    ))
            );
        }
        return Map.of(
                "customerId", customerId,
                "discount", discount,
                "shipping", shipping,
                "notes", "Observacao",
                "paymentTerms", "Pix",
                "items", List.of(
                        Map.of(
                                "itemType", "PRODUCT",
                                "productId", productId,
                                "quantity", "2.000",
                                "unitPrice", "30.00",
                                "discount", "5.00"
                        ),
                        Map.of(
                                "itemType", "SERVICE",
                                "serviceId", serviceId,
                                "quantity", "1.000",
                                "unitPrice", "80.00",
                                "discount", "0.00"
                        )
                )
        );
    }
}
