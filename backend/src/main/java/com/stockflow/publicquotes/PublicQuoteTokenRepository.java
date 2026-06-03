package com.stockflow.publicquotes;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PublicQuoteTokenRepository implements PanacheRepositoryBase<PublicQuoteTokenEntity, UUID> {

    public Optional<PublicQuoteTokenEntity> findByToken(String token) {
        return find("token", token).firstResultOptional();
    }

    public Optional<PublicQuoteTokenEntity> findLatestByQuote(UUID companyId, UUID quoteId) {
        return find("company.id = ?1 and quote.id = ?2 order by createdAt desc", companyId, quoteId)
                .firstResultOptional();
    }
}
