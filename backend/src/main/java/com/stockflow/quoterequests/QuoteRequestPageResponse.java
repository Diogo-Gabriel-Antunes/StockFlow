package com.stockflow.quoterequests;

import java.util.List;

public record QuoteRequestPageResponse(
        List<QuoteRequestResponse> items,
        List<QuoteRequestResponse> content,
        int page,
        int size,
        long total,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public QuoteRequestPageResponse(List<QuoteRequestResponse> items, int page, int size, long total) {
        this(
                items,
                items,
                page,
                size,
                total,
                total,
                totalPages(total, size),
                page == 0,
                page >= totalPages(total, size) - 1
        );
    }

    private static int totalPages(long total, int size) {
        if (total == 0) {
            return 0;
        }
        return (int) Math.ceil((double) total / size);
    }
}
