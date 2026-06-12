package com.stockflow.quoterequests;

import com.stockflow.customers.CustomerEntity;
import com.stockflow.notifications.BusinessEventService;
import com.stockflow.products.ProductEntity;
import com.stockflow.products.ProductRepository;
import com.stockflow.quotes.QuoteEntity;
import com.stockflow.quotes.QuoteRepository;
import com.stockflow.quotes.QuoteResponse;
import com.stockflow.quotes.QuoteStatus;
import com.stockflow.shared.security.AuthenticatedTenant;
import com.stockflow.users.UserEntity;
import com.stockflow.users.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class QuoteRequestService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    QuoteRequestRepository quoteRequestRepository;

    @Inject
    QuoteRepository quoteRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    @Inject
    BusinessEventService businessEventService;

    @Inject
    ProductRepository productRepository;

    public QuoteRequestPageResponse list(QuoteRequestStatus status, String search, Integer page, Integer size) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();
        return new QuoteRequestPageResponse(
                quoteRequestRepository.listByCompany(companyId, status, search, safePage, safeSize)
                        .stream()
                        .map(QuoteRequestResponse::from)
                        .toList(),
                safePage,
                safeSize,
                quoteRequestRepository.countByCompany(companyId, status, search)
        );
    }

    public QuoteRequestResponse get(UUID id) {
        return QuoteRequestResponse.from(findCurrentCompanyRequest(id));
    }

    public List<QuoteRequestResponse> listByCustomer(CustomerEntity customer) {
        return quoteRequestRepository.listByCustomer(customer.id)
                .stream()
                .map(QuoteRequestResponse::from)
                .toList();
    }

    public long countByCustomer(CustomerEntity customer) {
        return quoteRequestRepository.countByCustomer(customer.id);
    }

    @Transactional
    public QuoteRequestResponse createFromPortal(CustomerEntity customer, QuoteRequestInput input) {
        QuoteRequestEntity request = new QuoteRequestEntity();
        request.company = customer.company;
        request.customer = customer;
        request.status = QuoteRequestStatus.REQUESTED;
        applyInput(request, input);
        quoteRequestRepository.persist(request);
        businessEventService.quoteRequestCreated(request);
        return QuoteRequestResponse.from(request);
    }

    @Transactional
    public QuoteRequestResponse updateFromPortal(CustomerEntity customer, UUID id, QuoteRequestInput input) {
        QuoteRequestEntity request = quoteRequestRepository.findByCustomerAndId(customer.id, id)
                .orElseThrow(NotFoundException::new);
        ensureEditableByCustomer(request);
        applyInput(request, input);
        return QuoteRequestResponse.from(request);
    }

    @Transactional
    public QuoteRequestResponse cancelFromPortal(CustomerEntity customer, UUID id) {
        QuoteRequestEntity request = quoteRequestRepository.findByCustomerAndId(customer.id, id)
                .orElseThrow(NotFoundException::new);
        ensureEditableByCustomer(request);
        request.status = QuoteRequestStatus.CANCELLED;
        request.cancelledAt = OffsetDateTime.now();
        businessEventService.quoteRequestCancelledByCustomer(request);
        return QuoteRequestResponse.from(request);
    }

    @Transactional
    public QuoteRequestResponse updateStatus(UUID id, UpdateQuoteRequestStatusRequest input) {
        QuoteRequestEntity request = findCurrentCompanyRequest(id);
        if (input.status() != QuoteRequestStatus.IN_REVIEW && input.status() != QuoteRequestStatus.CANCELLED) {
            throw new BadRequestException("Unsupported quote request status transition");
        }
        if (request.status == QuoteRequestStatus.CONVERTED_TO_QUOTE) {
            throw new BadRequestException("Converted quote requests cannot change status");
        }
        request.status = input.status();
        if (request.status == QuoteRequestStatus.CANCELLED) {
            request.cancelledAt = OffsetDateTime.now();
        }
        return QuoteRequestResponse.from(request);
    }

    @Transactional
    public QuoteResponse convertToQuote(UUID id) {
        QuoteRequestEntity request = findCurrentCompanyRequest(id);
        if (request.status != QuoteRequestStatus.REQUESTED && request.status != QuoteRequestStatus.IN_REVIEW) {
            throw new BadRequestException("Only requested or in-review quote requests can be converted");
        }

        QuoteEntity quote = new QuoteEntity();
        quote.company = request.company;
        quote.customer = request.customer;
        UserEntity currentUser = findCurrentUser();
        quote.createdBy = currentUser;
        quote.code = nextCode();
        quote.status = QuoteStatus.DRAFT;
        quote.notes = conversionNotes(request);
        quote.paymentTerms = request.company.defaultPaymentTerms;
        quote.validUntil = request.company.defaultQuoteValidityDays == null
                ? null
                : java.time.LocalDate.now().plusDays(request.company.defaultQuoteValidityDays);
        quoteRepository.persist(quote);

        request.status = QuoteRequestStatus.CONVERTED_TO_QUOTE;
        request.convertedQuote = quote;
        request.convertedAt = OffsetDateTime.now();
        businessEventService.quoteRequestConverted(request, quote, currentUser);
        return QuoteResponse.from(quote);
    }

    private QuoteRequestEntity findCurrentCompanyRequest(UUID id) {
        return quoteRequestRepository.findByCompanyAndId(authenticatedTenant.companyId(), id)
                .orElseThrow(NotFoundException::new);
    }

    private void applyInput(QuoteRequestEntity request, QuoteRequestInput input) {
        request.title = input.title().trim();
        request.description = trimToNull(input.description());
        request.items.clear();
        for (QuoteRequestItemInput itemInput : input.items()) {
            QuoteRequestItemEntity item = new QuoteRequestItemEntity();
            item.quoteRequest = request;
            applyItemInput(request, item, itemInput);
            request.items.add(item);
        }
    }

    private void applyItemInput(QuoteRequestEntity request, QuoteRequestItemEntity item, QuoteRequestItemInput itemInput) {
        String description = trimToNull(itemInput.description());
        if (itemInput.productId() == null && description == null) {
            throw new BadRequestException("Item must have productId or description");
        }
        if (itemInput.productId() != null) {
            ProductEntity product = productRepository.findActiveByCompanyAndId(request.company.id, itemInput.productId())
                    .orElseThrow(NotFoundException::new);
            item.product = product;
            item.productNameSnapshot = product.name;
            item.productSkuSnapshot = product.sku;
            item.productReferenceSnapshot = product.referenceCode;
            item.productImageUrlSnapshot = product.imageUrl;
            item.description = description;
        } else {
            item.description = description;
        }
            item.quantity = itemInput.quantity();
            item.notes = trimToNull(itemInput.notes());
    }

    private void ensureEditableByCustomer(QuoteRequestEntity request) {
        if (request.status != QuoteRequestStatus.REQUESTED) {
            throw new BadRequestException("This quote request can no longer be edited");
        }
    }

    private UserEntity findCurrentUser() {
        return userRepository.findByIdOptional(authenticatedTenant.userId())
                .orElseThrow(NotFoundException::new);
    }

    private String conversionNotes(QuoteRequestEntity request) {
        StringBuilder notes = new StringBuilder();
        notes.append("Solicitação do cliente: ").append(request.title);
        if (request.description != null && !request.description.isBlank()) {
            notes.append("\n\n").append(request.description);
        }
        notes.append("\n\nItens solicitados:");
        for (QuoteRequestItemEntity item : request.items) {
            String itemDescription = item.productNameSnapshot != null
                    ? item.productNameSnapshot
                    : item.description;
            notes.append("\n- ")
                    .append(itemDescription)
                    .append(" | Quantidade: ")
                    .append(item.quantity.stripTrailingZeros().toPlainString());
            if (item.productSkuSnapshot != null && !item.productSkuSnapshot.isBlank()) {
                notes.append(" | SKU: ").append(item.productSkuSnapshot);
            }
            if (item.productReferenceSnapshot != null && !item.productReferenceSnapshot.isBlank()) {
                notes.append(" | Ref.: ").append(item.productReferenceSnapshot);
            }
            if (item.product != null) {
                notes.append(" | Produto selecionado: ").append(item.product.id);
            }
            if (item.notes != null && !item.notes.isBlank()) {
                notes.append(" | Observação: ").append(item.notes);
            }
        }
        return notes.toString();
    }

    private String nextCode() {
        String timestamp = OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        String suffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "Q-" + timestamp + "-" + suffix;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
