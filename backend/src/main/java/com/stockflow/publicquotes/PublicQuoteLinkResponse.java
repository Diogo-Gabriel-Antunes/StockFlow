package com.stockflow.publicquotes;

import java.time.OffsetDateTime;

public record PublicQuoteLinkResponse(
        String token,
        String url,
        OffsetDateTime expiresAt
) {
}
