package com.stockflow.customerportal;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import io.quarkus.test.junit.QuarkusTest;
import java.time.Instant;
import java.util.AbstractMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

@QuarkusTest
class CustomerPortalResourceTest {

    @Test
    void customerHasUniquePortalTokenAndOverviewIsScopedByToken() {
        String token = registerAndToken("portal-overview");
        String firstPortalToken = createCustomerAndPortalToken(token, "Cliente Portal A");
        String secondPortalToken = createCustomerAndPortalToken(token, "Cliente Portal B");

        org.hamcrest.MatcherAssert.assertThat(firstPortalToken, not(equalTo(secondPortalToken)));

        given()
                .when()
                .get("/public/customer-portal/{token}", "token-invalido")
                .then()
                .statusCode(404);

        given()
                .when()
                .get("/public/customer-portal/{token}", firstPortalToken)
                .then()
                .statusCode(200)
                .body("customer.name", equalTo("Cliente Portal A"))
                .body("company.tradeName", notNullValue())
                .body("summary.openQuotes", equalTo(0));
    }

    @Test
    void portalListsOnlyCustomerQuotesAndDoesNotExposeDrafts() {
        String token = registerAndToken("portal-quotes");
        CustomerData first = createCustomer(token, "Cliente com proposta");
        CustomerData second = createCustomer(token, "Outro cliente");
        String productId = createProduct(token, "Produto Portal", "P-PORTAL", "30.00");
        String sentQuoteId = createQuote(token, first.id(), productId);
        String draftQuoteId = createQuote(token, first.id(), productId);
        String otherCustomerQuoteId = createQuote(token, second.id(), productId);

        sendQuote(token, sentQuoteId);
        sendQuote(token, otherCustomerQuoteId);

        given()
                .queryParam("statusGroup", "open")
                .when()
                .get("/public/customer-portal/{token}/quotes", first.portalToken())
                .then()
                .statusCode(200)
                .body("content", hasSize(1))
                .body("content[0].id", equalTo(sentQuoteId));

        given()
                .when()
                .get("/public/customer-portal/{token}/quotes/{quoteId}", first.portalToken(), draftQuoteId)
                .then()
                .statusCode(404);

        given()
                .when()
                .get("/public/customer-portal/{token}/quotes/{quoteId}", first.portalToken(), sentQuoteId)
                .then()
                .statusCode(200)
                .body("items[0].stockQuantity", nullValue())
                .body("items[0].minimumStock", nullValue());

        given()
                .when()
                .get("/public/customer-portal/{token}/quotes/{quoteId}", first.portalToken(), otherCustomerQuoteId)
                .then()
                .statusCode(404);
    }

    @Test
    void portalApprovesRejectsAndDownloadsPdfWithoutDeductingStock() {
        String token = registerAndToken("portal-actions");
        CustomerData customer = createCustomer(token, "Cliente ações");
        String productId = createProduct(token, "Produto Ações", "P-ACTION", "30.00");
        String approveQuoteId = createQuote(token, customer.id(), productId);
        String rejectQuoteId = createQuote(token, customer.id(), productId);
        sendQuote(token, approveQuoteId);
        sendQuote(token, rejectQuoteId);

        given()
                .when()
                .post("/public/customer-portal/{token}/quotes/{quoteId}/approve", customer.portalToken(), approveQuoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("CUSTOMER_APPROVED"))
                .body("canApprove", equalTo(false));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("stockQuantity", equalTo(10.0F));

        given()
                .contentType("application/json")
                .body(Map.of("reason", "Valor acima do previsto"))
                .when()
                .post("/public/customer-portal/{token}/quotes/{quoteId}/reject", customer.portalToken(), rejectQuoteId)
                .then()
                .statusCode(200)
                .body("status", equalTo("REJECTED"));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quotes/{id}", rejectQuoteId)
                .then()
                .statusCode(200)
                .body("rejectionReason", equalTo("Valor acima do previsto"))
                .body("stockDeducted", equalTo(false));

        given()
                .when()
                .get("/public/customer-portal/{token}/quotes/{quoteId}/pdf", customer.portalToken(), approveQuoteId)
                .then()
                .statusCode(200)
                .contentType("application/pdf");
    }

    @Test
    void customerCreatesEditsCancelsAndInternalUserConvertsQuoteRequest() {
        String token = registerAndToken("portal-requests");
        CustomerData customer = createCustomer(token, "Cliente solicitações");

        String requestId = given()
                .contentType("application/json")
                .body(quoteRequest("Uniformes", "Primeiro pedido"))
                .when()
                .post("/public/customer-portal/{token}/quote-requests", customer.portalToken())
                .then()
                .statusCode(200)
                .body("status", equalTo("REQUESTED"))
                .body("customerId", equalTo(customer.id()))
                .body("items", hasSize(1))
                .extract()
                .path("id");

        given()
                .contentType("application/json")
                .body(quoteRequest("Uniformes revisados", "Pedido alterado"))
                .when()
                .put("/public/customer-portal/{token}/quote-requests/{requestId}", customer.portalToken(), requestId)
                .then()
                .statusCode(200)
                .body("title", equalTo("Uniformes revisados"));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quote-requests")
                .then()
                .statusCode(200)
                .body("total", equalTo(1))
                .body("items[0].id", equalTo(requestId));

        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("status", "IN_REVIEW"))
                .when()
                .put("/quote-requests/{id}/status", requestId)
                .then()
                .statusCode(200)
                .body("status", equalTo("IN_REVIEW"));

        given()
                .contentType("application/json")
                .body(quoteRequest("Tentativa bloqueada", "Não pode"))
                .when()
                .put("/public/customer-portal/{token}/quote-requests/{requestId}", customer.portalToken(), requestId)
                .then()
                .statusCode(400);

        String quoteId = given()
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quote-requests/{id}/convert-to-quote", requestId)
                .then()
                .statusCode(200)
                .body("status", equalTo("DRAFT"))
                .body("customerId", equalTo(customer.id()))
                .body("items", hasSize(0))
                .extract()
                .path("id");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/quote-requests/{id}", requestId)
                .then()
                .statusCode(200)
                .body("status", equalTo("CONVERTED_TO_QUOTE"))
                .body("convertedQuoteId", equalTo(quoteId));
    }

    @Test
    void portalCatalogAndAutocompleteExposeOnlyActiveCompanyProducts() {
        String token = registerAndToken("portal-products");
        CustomerData customer = createCustomer(token, "Cliente catálogo");
        String otherToken = registerAndToken("portal-products-other");
        createCustomer(otherToken, "Outro cliente");
        String activeProductId = createProduct(token, "Bandana tamanho M", "BAND-M", "30.00");
        String inactiveProductId = createProduct(token, "Bandana inativa", "BAND-OFF", "30.00");
        createProduct(otherToken, "Bandana outra empresa", "BAND-OTHER", "30.00");
        deactivateProduct(token, inactiveProductId);

        given()
                .when()
                .get("/public/customer-portal/{token}/products", "token-invalido")
                .then()
                .statusCode(404);

        given()
                .queryParam("search", "Bandana")
                .queryParam("page", 0)
                .queryParam("size", 12)
                .when()
                .get("/public/customer-portal/{token}/products", customer.portalToken())
                .then()
                .statusCode(200)
                .body("items", hasSize(1))
                .body("items[0].id", equalTo(activeProductId))
                .body("items[0].name", equalTo("Bandana tamanho M"))
                .body("items[0].description", equalTo("Produto do catálogo"))
                .body("items[0].sku", equalTo("BAND-M"))
                .body("items[0].referenceCode", equalTo("REF-BAND-M"))
                .body("items[0].imageUrl", equalTo("https://example.com/BAND-M.jpg"))
                .body("items[0].costPrice", nullValue())
                .body("items[0].stockQuantity", nullValue())
                .body("totalElements", equalTo(1));

        given()
                .queryParam("query", "Ba")
                .when()
                .get("/public/customer-portal/{token}/products/search", customer.portalToken())
                .then()
                .statusCode(200)
                .body("", hasSize(0));

        given()
                .queryParam("query", "BAND-M")
                .when()
                .get("/public/customer-portal/{token}/products/search", customer.portalToken())
                .then()
                .statusCode(200)
                .body("", hasSize(1))
                .body("[0].id", equalTo(activeProductId))
                .body("[0].costPrice", nullValue())
                .body("[0].stockQuantity", nullValue());
    }

    @Test
    void customerCreatesQuoteRequestWithSelectedProductAndManualItem() {
        String token = registerAndToken("portal-request-products");
        CustomerData customer = createCustomer(token, "Cliente produto");
        String productId = createProduct(token, "Coleira azul", "COL-AZUL", "45.00");
        String inactiveProductId = createProduct(token, "Coleira inativa", "COL-OFF", "45.00");
        deactivateProduct(token, inactiveProductId);
        String otherToken = registerAndToken("portal-request-products-other");
        String otherProductId = createProduct(otherToken, "Produto outra empresa", "OTHER-P", "45.00");

        String requestId = given()
                .contentType("application/json")
                .body(Map.of(
                        "title", "Compra com catálogo",
                        "description", "Itens para avaliar",
                        "items", List.of(
                                Map.of(
                                        "productId", productId,
                                        "quantity", "3.000",
                                        "notes", "Preferência azul"
                                ),
                                Map.of(
                                        "description", "Item personalizado",
                                        "quantity", "2.000",
                                        "notes", "Sem cadastro"
                                )
                        )
                ))
                .when()
                .post("/public/customer-portal/{token}/quote-requests", customer.portalToken())
                .then()
                .statusCode(200)
                .body("items", hasSize(2))
                .body("items[0].productId", equalTo(productId))
                .body("items[0].productNameSnapshot", equalTo("Coleira azul"))
                .body("items[0].productSkuSnapshot", equalTo("COL-AZUL"))
                .body("items[0].productReferenceSnapshot", equalTo("REF-COL-AZUL"))
                .body("items[0].productImageUrlSnapshot", equalTo("https://example.com/COL-AZUL.jpg"))
                .body("items[1].productId", nullValue())
                .body("items[1].description", equalTo("Item personalizado"))
                .extract()
                .path("id");

        given()
                .contentType("application/json")
                .body(Map.of(
                        "title", "Produto inativo",
                        "items", List.of(Map.of("productId", inactiveProductId, "quantity", "1.000"))
                ))
                .when()
                .post("/public/customer-portal/{token}/quote-requests", customer.portalToken())
                .then()
                .statusCode(404);

        given()
                .contentType("application/json")
                .body(Map.of(
                        "title", "Produto outra empresa",
                        "items", List.of(Map.of("productId", otherProductId, "quantity", "1.000"))
                ))
                .when()
                .post("/public/customer-portal/{token}/quote-requests", customer.portalToken())
                .then()
                .statusCode(404);

        given()
                .contentType("application/json")
                .body(Map.of(
                        "title", "Manual inválido",
                        "items", List.of(Map.of("quantity", "1.000"))
                ))
                .when()
                .post("/public/customer-portal/{token}/quote-requests", customer.portalToken())
                .then()
                .statusCode(400);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quote-requests/{id}/convert-to-quote", requestId)
                .then()
                .statusCode(200)
                .body("status", equalTo("DRAFT"))
                .body("stockDeducted", equalTo(false))
                .body("customerId", equalTo(customer.id()));
    }

    @Test
    void customerCanCancelOnlyRequestedQuoteRequest() {
        String token = registerAndToken("portal-cancel");
        CustomerData customer = createCustomer(token, "Cliente cancelamento");

        String requestId = given()
                .contentType("application/json")
                .body(quoteRequest("Pedido para cancelar", "Cancelar"))
                .when()
                .post("/public/customer-portal/{token}/quote-requests", customer.portalToken())
                .then()
                .statusCode(200)
                .extract()
                .path("id");

        given()
                .when()
                .post("/public/customer-portal/{token}/quote-requests/{requestId}/cancel", customer.portalToken(), requestId)
                .then()
                .statusCode(200)
                .body("status", equalTo("CANCELLED"));

        given()
                .when()
                .post("/public/customer-portal/{token}/quote-requests/{requestId}/cancel", customer.portalToken(), requestId)
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

    private String createCustomerAndPortalToken(String token, String name) {
        return createCustomer(token, name).portalToken();
    }

    private CustomerData createCustomer(String token, String name) {
        String id = given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of("name", name, "type", "COMPANY"))
                .when()
                .post("/customers")
                .then()
                .statusCode(201)
                .body("portalToken", notNullValue())
                .extract()
                .path("id");

        String portalToken = given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/customers/{id}", id)
                .then()
                .statusCode(200)
                .extract()
                .path("portalToken");
        return new CustomerData(id, portalToken);
    }

    private String createProduct(String token, String name, String sku, String salePrice) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(productPayload(name, sku, salePrice, true))
                .when()
                .post("/products")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private void deactivateProduct(String token, String productId) {
        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(productPayload("Produto inativo", "OFF-" + productId.substring(0, 6), "30.00", false))
                .when()
                .put("/products/{id}", productId)
                .then()
                .statusCode(200)
                .body("active", equalTo(false));
    }

    private Map<String, Object> productPayload(String name, String sku, String salePrice, boolean active) {
        return Map.ofEntries(
                        entry("name", name),
                        entry("sku", sku),
                        entry("category", "Portal"),
                        entry("description", "Produto do catálogo"),
                        entry("referenceCode", "REF-" + sku),
                        entry("imageUrl", "https://example.com/" + sku + ".jpg"),
                        entry("costPrice", "10.00"),
                        entry("salePrice", salePrice),
                        entry("unit", "UN"),
                        entry("stockQuantity", "10.000"),
                        entry("minimumStock", "2.000"),
                        entry("active", active)
        );
    }

    private Map.Entry<String, Object> entry(String key, Object value) {
        return new AbstractMap.SimpleEntry<>(key, value);
    }

    private String createQuote(String token, String customerId, String productId) {
        return given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .body(Map.of(
                        "customerId", customerId,
                        "discount", "0.00",
                        "shipping", "0.00",
                        "items", List.of(Map.of(
                                "itemType", "PRODUCT",
                                "productId", productId,
                                "quantity", "2.000",
                                "unitPrice", "30.00",
                                "discount", "0.00"
                        ))
                ))
                .when()
                .post("/quotes")
                .then()
                .statusCode(201)
                .extract()
                .path("id");
    }

    private void sendQuote(String token, String quoteId) {
        given()
                .contentType("application/json")
                .header("Authorization", "Bearer " + token)
                .when()
                .post("/quotes/{id}/send", quoteId)
                .then()
                .statusCode(200);
    }

    private Map<String, Object> quoteRequest(String title, String description) {
        return Map.of(
                "title", title,
                "description", description,
                "items", List.of(Map.of(
                        "description", "Bandana tamanho M",
                        "quantity", "20.000",
                        "notes", "Cores variadas"
                ))
        );
    }

    private record CustomerData(String id, String portalToken) {
    }
}
