package com.stockflow.publicquotes;

import com.stockflow.quotes.QuoteApprovalService;
import com.stockflow.quotes.QuoteEntity;
import com.stockflow.quotes.QuoteStatus;
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

    @ConfigProperty(name = "stockflow.public-quote-base-url")
    String publicQuoteBaseUrl;

    @Transactional
    public PublicQuoteLinkResponse generateLink(QuoteEntity quote) {
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
        quoteApprovalService.approve(publicToken.quote);
        return PublicQuoteResponse.from(publicToken);
    }

    @Transactional
    public PublicQuoteResponse reject(String token) {
        PublicQuoteTokenEntity publicToken = findToken(token);
        ensureNotExpired(publicToken);
        if (publicToken.quote.status != QuoteStatus.APPROVED) {
            publicToken.quote.status = QuoteStatus.REJECTED;
        }
        return PublicQuoteResponse.from(publicToken);
    }

    public byte[] pdf(String token) {
        return quotePdfService.generate(findToken(token).quote);
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
}
