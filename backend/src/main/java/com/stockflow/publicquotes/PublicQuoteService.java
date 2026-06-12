package com.stockflow.publicquotes;

import com.stockflow.quotes.QuoteApprovalService;
import com.stockflow.quotes.QuoteEntity;
import com.stockflow.quotes.QuoteStatus;
import com.stockflow.notifications.BusinessEventService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class PublicQuoteService {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Inject
    PublicQuoteTokenRepository publicQuoteTokenRepository;

    @Inject
    QuoteApprovalService quoteApprovalService;

    @Inject
    QuotePdfService quotePdfService;

    @Inject
    BusinessEventService businessEventService;

    @ConfigProperty(name = "stockflow.public-quote-base-url")
    String publicQuoteBaseUrl;

    @Transactional
    public PublicQuoteLinkResponse generateLink(QuoteEntity quote) {
        if (quote.status == QuoteStatus.DRAFT) {
            quote.status = QuoteStatus.SENT;
        }
        PublicQuoteTokenEntity currentToken = publicQuoteTokenRepository
                .findLatestByQuote(quote.company.id, quote.id)
                .filter(token -> token.expiresAt.isAfter(OffsetDateTime.now()))
                .orElse(null);
        if (currentToken != null) {
            return new PublicQuoteLinkResponse(
                    currentToken.token,
                    publicQuoteBaseUrl + "/" + currentToken.token,
                    currentToken.expiresAt
            );
        }
        PublicQuoteTokenEntity token = new PublicQuoteTokenEntity();
        token.company = quote.company;
        token.quote = quote;
        token.token = newToken();
        token.expiresAt = expiresAt(quote);
        publicQuoteTokenRepository.persist(token);
        return new PublicQuoteLinkResponse(token.token, publicQuoteBaseUrl + "/" + token.token, token.expiresAt);
    }

    public PublicQuoteResponse get(String token) {
        return PublicQuoteResponse.from(findToken(token));
    }

    @Transactional(dontRollbackOn = BadRequestException.class)
    public PublicQuoteResponse approve(String token) {
        PublicQuoteTokenEntity publicToken = findToken(token);
        ensureNotExpired(publicToken);
        QuoteStatus previousStatus = publicToken.quote.status;
        quoteApprovalService.markCustomerApproved(publicToken.quote);
        if (previousStatus == QuoteStatus.SENT) {
            businessEventService.quoteApprovedByCustomer(publicToken.quote);
        }
        return PublicQuoteResponse.from(publicToken);
    }

    @Transactional
    public PublicQuoteResponse reject(String token) {
        return reject(token, null);
    }

    @Transactional
    public PublicQuoteResponse reject(String token, RejectPublicQuoteRequest request) {
        PublicQuoteTokenEntity publicToken = findToken(token);
        ensureNotExpired(publicToken);
        rejectQuote(publicToken.quote, request == null ? null : request.reason());
        return PublicQuoteResponse.from(publicToken);
    }

    public QuotePdfResponse pdf(String token) {
        return quotePdfService.generate(findToken(token).quote);
    }

    public QuoteEntity rejectQuote(QuoteEntity quote, String reason) {
        if (quote.status == QuoteStatus.COMPLETED
                || quote.status == QuoteStatus.CANCELLED
                || quote.status == QuoteStatus.EXPIRED
                || quote.status == QuoteStatus.REJECTED) {
            throw new BadRequestException("Quote cannot be rejected in current status");
        }
        if (quote.status != QuoteStatus.SENT) {
            throw new BadRequestException("Only sent quotes can be rejected by the customer");
        }
        quote.status = QuoteStatus.REJECTED;
        quote.customerRejectedAt = OffsetDateTime.now();
        quote.customerDecisionAt = quote.customerRejectedAt;
        quote.rejectionReason = trimToNull(reason);
        businessEventService.quoteRejectedByCustomer(quote);
        return quote;
    }

    private PublicQuoteTokenEntity findToken(String token) {
        return publicQuoteTokenRepository.findByToken(token)
                .orElseThrow(NotFoundException::new);
    }

    private void ensureNotExpired(PublicQuoteTokenEntity token) {
        if (token.expiresAt.isBefore(OffsetDateTime.now())) {
            token.quote.status = QuoteStatus.EXPIRED;
            throw new BadRequestException("Public quote link is expired");
        }
    }

    private OffsetDateTime expiresAt(QuoteEntity quote) {
        LocalDate validUntil = quote.validUntil == null ? LocalDate.now().plusDays(30) : quote.validUntil;
        return validUntil.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
