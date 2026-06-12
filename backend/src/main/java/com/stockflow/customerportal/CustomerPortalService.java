package com.stockflow.customerportal;

import com.stockflow.customers.CustomerEntity;
import com.stockflow.customers.CustomerRepository;
import com.stockflow.publicquotes.PublicQuoteService;
import com.stockflow.publicquotes.QuotePdfResponse;
import com.stockflow.publicquotes.QuotePdfService;
import com.stockflow.publicquotes.RejectPublicQuoteRequest;
import com.stockflow.products.ProductRepository;
import com.stockflow.notifications.BusinessEventService;
import com.stockflow.quoterequests.QuoteRequestInput;
import com.stockflow.quoterequests.QuoteRequestResponse;
import com.stockflow.quoterequests.QuoteRequestService;
import com.stockflow.quotes.QuoteApprovalService;
import com.stockflow.quotes.QuoteEntity;
import com.stockflow.quotes.QuoteRepository;
import com.stockflow.quotes.QuoteStatus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class CustomerPortalService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;
    private static final List<QuoteStatus> OPEN_STATUSES = List.of(QuoteStatus.SENT, QuoteStatus.CUSTOMER_APPROVED);
    private static final List<QuoteStatus> COMPLETED_STATUSES = List.of(
            QuoteStatus.COMPLETED,
            QuoteStatus.REJECTED,
            QuoteStatus.CANCELLED,
            QuoteStatus.EXPIRED
    );

    @Inject
    CustomerRepository customerRepository;

    @Inject
    QuoteRepository quoteRepository;

    @Inject
    QuoteApprovalService quoteApprovalService;

    @Inject
    PublicQuoteService publicQuoteService;

    @Inject
    QuotePdfService quotePdfService;

    @Inject
    QuoteRequestService quoteRequestService;

    @Inject
    BusinessEventService businessEventService;

    @Inject
    ProductRepository productRepository;

    public CustomerPortalOverviewResponse overview(String token) {
        CustomerEntity customer = findCustomer(token);
        return CustomerPortalOverviewResponse.from(
                customer,
                quoteRepository.countByCustomerAndStatuses(customer.id, OPEN_STATUSES),
                quoteRepository.countByCustomerAndStatuses(customer.id, COMPLETED_STATUSES),
                quoteRequestService.countByCustomer(customer)
        );
    }

    public CustomerPortalQuotePageResponse quotes(String token, String statusGroup, Integer page, Integer size) {
        CustomerEntity customer = findCustomer(token);
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        List<QuoteStatus> statuses = "completed".equalsIgnoreCase(statusGroup) ? COMPLETED_STATUSES : OPEN_STATUSES;
        return new CustomerPortalQuotePageResponse(
                quoteRepository.listByCustomerAndStatuses(customer.id, statuses, safePage, safeSize)
                        .stream()
                        .map(CustomerPortalQuoteResponse::summary)
                        .toList(),
                safePage,
                safeSize,
                quoteRepository.countByCustomerAndStatuses(customer.id, statuses)
        );
    }

    public CustomerPortalQuoteResponse quote(String token, UUID quoteId) {
        return CustomerPortalQuoteResponse.detail(findCustomerQuote(token, quoteId));
    }

    @Transactional(dontRollbackOn = jakarta.ws.rs.BadRequestException.class)
    public CustomerPortalQuoteResponse approve(String token, UUID quoteId) {
        QuoteEntity quote = findCustomerQuote(token, quoteId);
        QuoteStatus previousStatus = quote.status;
        quoteApprovalService.markCustomerApproved(quote);
        if (previousStatus == QuoteStatus.SENT) {
            businessEventService.quoteApprovedByCustomer(quote);
        }
        return CustomerPortalQuoteResponse.detail(quote);
    }

    @Transactional
    public CustomerPortalQuoteResponse reject(String token, UUID quoteId, RejectPublicQuoteRequest request) {
        QuoteEntity quote = findCustomerQuote(token, quoteId);
        publicQuoteService.rejectQuote(quote, request == null ? null : request.reason());
        return CustomerPortalQuoteResponse.detail(quote);
    }

    public QuotePdfResponse pdf(String token, UUID quoteId) {
        return quotePdfService.generate(findCustomerQuote(token, quoteId));
    }

    public CustomerPortalProductPageResponse products(String token, String search, Integer page, Integer size) {
        CustomerEntity customer = findCustomer(token);
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? 12 : size, 1), MAX_PAGE_SIZE);
        UUID companyId = customer.company.id;
        return new CustomerPortalProductPageResponse(
                productRepository.listActiveByCompany(companyId, search, safePage, safeSize)
                        .stream()
                        .map(CustomerPortalProductResponse::from)
                        .toList(),
                safePage,
                safeSize,
                productRepository.countActiveByCompany(companyId, search)
        );
    }

    public List<CustomerPortalProductResponse> searchProducts(String token, String query) {
        CustomerEntity customer = findCustomer(token);
        if (query == null || query.trim().length() < 3) {
            return List.of();
        }
        return productRepository.searchActiveByCompany(customer.company.id, query, 10)
                .stream()
                .map(CustomerPortalProductResponse::from)
                .toList();
    }

    public CustomerPortalProductResponse product(String token, UUID productId) {
        CustomerEntity customer = findCustomer(token);
        return productRepository.findActiveByCompanyAndId(customer.company.id, productId)
                .map(CustomerPortalProductResponse::from)
                .orElseThrow(NotFoundException::new);
    }

    public List<QuoteRequestResponse> quoteRequests(String token) {
        return quoteRequestService.listByCustomer(findCustomer(token));
    }

    public QuoteRequestResponse quoteRequest(String token, UUID requestId) {
        CustomerEntity customer = findCustomer(token);
        return quoteRequestService.listByCustomer(customer)
                .stream()
                .filter(request -> request.id().equals(requestId))
                .findFirst()
                .orElseThrow(NotFoundException::new);
    }

    public QuoteRequestResponse createQuoteRequest(String token, QuoteRequestInput input) {
        return quoteRequestService.createFromPortal(findCustomer(token), input);
    }

    public QuoteRequestResponse updateQuoteRequest(String token, UUID requestId, QuoteRequestInput input) {
        return quoteRequestService.updateFromPortal(findCustomer(token), requestId, input);
    }

    public QuoteRequestResponse cancelQuoteRequest(String token, UUID requestId) {
        return quoteRequestService.cancelFromPortal(findCustomer(token), requestId);
    }

    private CustomerEntity findCustomer(String token) {
        if (token == null || token.isBlank()) {
            throw new NotFoundException();
        }
        return customerRepository.findActiveByPortalToken(token)
                .orElseThrow(NotFoundException::new);
    }

    private QuoteEntity findCustomerQuote(String token, UUID quoteId) {
        CustomerEntity customer = findCustomer(token);
        QuoteEntity quote = quoteRepository.findByCustomerAndId(customer.id, quoteId)
                .orElseThrow(NotFoundException::new);
        if (quote.status == QuoteStatus.DRAFT) {
            throw new NotFoundException();
        }
        return quote;
    }
}
