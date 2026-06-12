package com.stockflow.customerportal;

import java.util.List;

public record CustomerPortalQuotePageResponse(
        List<CustomerPortalQuoteResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public CustomerPortalQuotePageResponse(List<CustomerPortalQuoteResponse> content, int page, int size, long totalElements) {
        this(
                content,
                page,
                size,
                totalElements,
                totalPages(totalElements, size),
                page == 0,
                page >= totalPages(totalElements, size) - 1
        );
    }

    private static int totalPages(long total, int size) {
        if (total == 0) {
            return 0;
        }
        return (int) Math.ceil((double) total / size);
    }
}
