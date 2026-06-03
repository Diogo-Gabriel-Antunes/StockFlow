package com.stockflow.quotes;

import com.stockflow.customers.CustomerEntity;
import com.stockflow.customers.CustomerRepository;
import com.stockflow.products.ProductEntity;
import com.stockflow.products.ProductRepository;
import com.stockflow.services.ServiceItemEntity;
import com.stockflow.services.ServiceItemRepository;
import com.stockflow.shared.security.AuthenticatedTenant;
import com.stockflow.users.UserEntity;
import com.stockflow.users.UserRepository;
import com.stockflow.publicquotes.PublicQuoteLinkResponse;
import com.stockflow.publicquotes.PublicQuoteService;
import com.stockflow.publicquotes.QuotePdfService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@ApplicationScoped
public class QuoteService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    QuoteRepository quoteRepository;

    @Inject
    CustomerRepository customerRepository;

    @Inject
    ProductRepository productRepository;

    @Inject
    ServiceItemRepository serviceItemRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    @Inject
    QuoteCalculator quoteCalculator;

    @Inject
    QuoteApprovalService quoteApprovalService;

    @Inject
    PublicQuoteService publicQuoteService;

    @Inject
    QuotePdfService quotePdfService;

    public QuotePageResponse list(QuoteStatus status, Integer page, Integer size) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();
        return new QuotePageResponse(
                quoteRepository.listByCompany(companyId, status, safePage, safeSize)
                        .stream()
                        .map(QuoteResponse::from)
                        .toList(),
                safePage,
                safeSize,
                quoteRepository.countByCompany(companyId, status)
        );
    }

    public QuoteResponse get(UUID id) {
        return QuoteResponse.from(findQuote(id));
    }

    @Transactional
    public QuoteResponse create(QuoteRequest request) {
        QuoteEntity quote = new QuoteEntity();
        quote.company = findCustomer(request.customerId()).company;
        quote.customer = findCustomer(request.customerId());
        quote.createdBy = findCurrentUser();
        quote.code = nextCode();
        quote.status = QuoteStatus.DRAFT;
        applyRequest(quote, request);
        quoteRepository.persist(quote);
        return QuoteResponse.from(quote);
    }

    @Transactional
    public QuoteResponse update(UUID id, QuoteRequest request) {
        QuoteEntity quote = findQuote(id);
        if (quote.status == QuoteStatus.APPROVED || quote.status == QuoteStatus.CANCELLED) {
            throw new BadRequestException("Only editable quotes can be updated");
        }
        quote.customer = findCustomer(request.customerId());
        applyRequest(quote, request);
        return QuoteResponse.from(quote);
    }

    @Transactional
    public void delete(UUID id) {
        QuoteEntity quote = findQuote(id);
        quote.status = QuoteStatus.CANCELLED;
    }

    @Transactional
    public QuoteResponse send(UUID id) {
        QuoteEntity quote = findQuote(id);
        if (quote.items.isEmpty()) {
            throw new BadRequestException("Quote must have at least one item");
        }
        quote.status = QuoteStatus.SENT;
        return QuoteResponse.from(quote);
    }

    @Transactional
    public QuoteResponse approve(UUID id) {
        QuoteEntity quote = findQuote(id);
        return QuoteResponse.from(quoteApprovalService.approve(quote));
    }

    @Transactional
    public QuoteResponse reject(UUID id) {
        QuoteEntity quote = findQuote(id);
        quote.status = QuoteStatus.REJECTED;
        return QuoteResponse.from(quote);
    }

    @Transactional
    public PublicQuoteLinkResponse generatePublicLink(UUID id) {
        return publicQuoteService.generateLink(findQuote(id));
    }

    public byte[] pdf(UUID id) {
        return quotePdfService.generate(findQuote(id));
    }

    private void applyRequest(QuoteEntity quote, QuoteRequest request) {
        quote.validUntil = request.validUntil();
        quote.notes = trimToNull(request.notes());
        quote.paymentTerms = trimToNull(request.paymentTerms());
        quote.items.clear();

        for (QuoteItemRequest itemRequest : request.items()) {
            quote.items.add(buildItem(quote, itemRequest));
        }

        QuoteTotals totals = quoteCalculator.totals(quote.items, request.discount(), request.shipping());
        quote.subtotal = totals.subtotal();
        quote.discount = totals.discount();
        quote.shipping = totals.shipping();
        quote.total = totals.total();
    }

    private QuoteItemEntity buildItem(QuoteEntity quote, QuoteItemRequest request) {
        QuoteItemEntity item = new QuoteItemEntity();
        item.company = quote.company;
        item.quote = quote;
        item.itemType = request.itemType();
        item.quantity = request.quantity();
        item.discount = request.discount() == null ? BigDecimal.ZERO : quoteCalculator.money(request.discount());

        if (request.itemType() == QuoteItemType.PRODUCT) {
            if (request.productId() == null) {
                throw new BadRequestException("Product item requires productId");
            }
            ProductEntity product = productRepository.findActiveByCompanyAndId(authenticatedTenant.companyId(), request.productId())
                    .orElseThrow(NotFoundException::new);
            item.product = product;
            item.description = descriptionOrDefault(request.description(), product.name);
            item.unitPrice = request.unitPrice() == null ? quoteCalculator.money(product.salePrice) : quoteCalculator.money(request.unitPrice());
        } else {
            if (request.serviceId() == null) {
                throw new BadRequestException("Service item requires serviceId");
            }
            ServiceItemEntity service = serviceItemRepository.findActiveByCompanyAndId(authenticatedTenant.companyId(), request.serviceId())
                    .orElseThrow(NotFoundException::new);
            item.service = service;
            item.description = descriptionOrDefault(request.description(), service.name);
            item.unitPrice = request.unitPrice() == null ? quoteCalculator.money(service.defaultPrice) : quoteCalculator.money(request.unitPrice());
        }

        item.total = quoteCalculator.itemTotal(item.quantity, item.unitPrice, item.discount);
        return item;
    }

    private QuoteEntity findQuote(UUID id) {
        return quoteRepository.findByCompanyAndId(authenticatedTenant.companyId(), id)
                .orElseThrow(NotFoundException::new);
    }

    private CustomerEntity findCustomer(UUID id) {
        return customerRepository.findActiveByCompanyAndId(authenticatedTenant.companyId(), id)
                .orElseThrow(NotFoundException::new);
    }

    private UserEntity findCurrentUser() {
        return userRepository.findByIdOptional(authenticatedTenant.userId())
                .orElseThrow(NotFoundException::new);
    }

    private String nextCode() {
        return "Q-" + OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
    }

    private String descriptionOrDefault(String value, String fallback) {
        String trimmed = trimToNull(value);
        return trimmed == null ? fallback : trimmed;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
