package com.stockflow.quotes;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
                .body("status", equalTo("CUSTOMER_APPROVED"))
                .body("stockDeducted", equalTo(false));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(10.0F));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/complete", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("COMPLETED"))
                .body("stockDeducted", equalTo(true))
                .body("completedAt", notNullValue())
                .body("completedBy", notNullValue());

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(8.0F));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("productId", productId)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("total", equalTo(1))
                .body("items[0].type", equalTo("SALE"))
                .body("items[0].quantity", equalTo(2.0F))
                .body("items[0].previousQuantity", equalTo(10.0F))
                .body("items[0].newQuantity", equalTo(8.0F))
                .body("items[0].referenceId", equalTo(quoteId));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/complete", quoteId)
                .then()
                .statusCode(400);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(8.0F));
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
    void newQuoteUsesCompanyDefaultsWhenFieldsAreMissingAndExplicitValuesHavePriority() {
        String token = registerAndToken("quotes-company-defaults");
        String customerId = createCustomer(token, "Cliente Padroes");
        String productId = createProduct(token, "Produto Padroes", "P-DEF", "30.00");

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "tradeName", "Empresa Padrão",
                        "email", "padrao@stockflow.test",
                        "state", "SC",
                        "defaultQuoteNotes", "Observação padrão da empresa",
                        "defaultPaymentTerms", "Pagamento padrão da empresa",
                        "defaultQuoteValidityDays", 7
                ))
                .when()
                .put("/company/settings")
                .then()
                .statusCode(200);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(quoteWithoutCommercialFields(customerId, productId))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .body("validUntil", equalTo(LocalDate.now().plusDays(7).toString()))
                .body("notes", equalTo("Observação padrão da empresa"))
                .body("paymentTerms", equalTo("Pagamento padrão da empresa"));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(explicitCommercialFieldsQuote(customerId, productId))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .body("validUntil", equalTo(LocalDate.now().plusDays(3).toString()))
                .body("notes", equalTo("Observação específica"))
                .body("paymentTerms", equalTo("Pagamento específico"));
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
                .get("/quotes/{id}/pdf", quoteId)
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

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + secondToken)
                .when()
                .post("/quotes/{id}/complete", quoteId)
                .then()
                .statusCode(404);
    }

    @Test
    void authenticatedUserCanDownloadOwnQuotePdf() {
        String token = registerAndToken("quotes-pdf");
        String customerId = createCustomer(token, "Cliente PDF Completo");
        String productId = createProduct(token, "Produto PDF Completo", "P-PDF", "30.00");
        String serviceId = createService(token, "Servico PDF Completo", "80.00");

        String quoteId = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(quote(customerId, productId, serviceId, "5.00", "12.00"))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        byte[] pdf = given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quotes/{id}/pdf", quoteId)
                .then()
                .statusCode(200)
                .contentType("application/pdf")
                .header("Content-Disposition", containsString("inline; filename=\"proposta-"))
                .body(containsString("%PDF-"))
                .extract()
                .asByteArray();

        org.hamcrest.MatcherAssert.assertThat(pdf.length, greaterThan(1000));
    }

    @Test
    void quotePdfRejectsMissingAndUnknownQuote() {
        String token = registerAndToken("quotes-pdf-invalid");

        given()
                .when()
                .get("/quotes/{id}/pdf", UUID.randomUUID())
                .then()
                .statusCode(401);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quotes/{id}/pdf", UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void completeValidatesAggregatedProductStockBeforeDeducting() {
        String token = registerAndToken("quotes-stock-aggregate");
        String customerId = createCustomer(token, "Cliente Estoque");
        String productId = createProduct(token, "Produto Agregado", "P-Q4", "20.00");

        String quoteId = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(repeatedProductQuote(customerId, productId))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/send", quoteId)
                .then()
                .statusCode(200);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/mark-customer-approved", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("CUSTOMER_APPROVED"));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/complete", quoteId)
                .then()
                .statusCode(400);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(10.0F));

        given()
                .header("Authorization", "Bearer " + token)
                .queryParam("productId", productId)
                .when()
                .get("/stock/movements")
                .then()
                .statusCode(200)
                .body("total", equalTo(0));
    }

    @Test
    void rejectedAndUnauthenticatedQuotesCannotBeCompleted() {
        String token = registerAndToken("quotes-complete-invalid");
        String customerId = createCustomer(token, "Cliente Completar Invalido");
        String productId = createProduct(token, "Produto Completar Invalido", "P-Q5", "20.00");
        String quoteId = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(quote(customerId, productId, null, "0.00", "0.00"))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .extract()
                .path("id");

        given()
                .contentType("application/json")
                .when()
                .post("/quotes/{id}/complete", quoteId)
                .then()
                .statusCode(401);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/send", quoteId)
                .then()
                .statusCode(200);

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/reject", quoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("REJECTED"));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/complete", quoteId)
                .then()
                .statusCode(400);
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

    private Map<String, Object> repeatedProductQuote(String customerId, String productId) {
        return Map.of(
                "customerId", customerId,
                "discount", "0.00",
                "shipping", "0.00",
                "items", List.of(
                        Map.of(
                                "itemType", "PRODUCT",
                                "productId", productId,
                                "quantity", "6.000",
                                "unitPrice", "20.00",
                                "discount", "0.00"
                        ),
                        Map.of(
                                "itemType", "PRODUCT",
                                "productId", productId,
                                "quantity", "5.000",
                                "unitPrice", "20.00",
                                "discount", "0.00"
                        )
                )
        );
    }

    private Map<String, Object> quoteWithoutCommercialFields(String customerId, String productId) {
        return Map.of(
                "customerId", customerId,
                "discount", "0.00",
                "shipping", "0.00",
                "items", List.of(Map.of(
                        "itemType", "PRODUCT",
                        "productId", productId,
                        "quantity", "1.000",
                        "unitPrice", "30.00",
                        "discount", "0.00"
                ))
        );
    }

    private Map<String, Object> explicitCommercialFieldsQuote(String customerId, String productId) {
        return Map.of(
                "customerId", customerId,
                "validUntil", LocalDate.now().plusDays(3).toString(),
                "discount", "0.00",
                "shipping", "0.00",
                "notes", "Observação específica",
                "paymentTerms", "Pagamento específico",
                "items", List.of(Map.of(
                        "itemType", "PRODUCT",
                        "productId", productId,
                        "quantity", "1.000",
                        "unitPrice", "30.00",
                        "discount", "0.00"
                ))
        );
    }
}
