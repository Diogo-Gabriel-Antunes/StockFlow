package com.stockflow.products;

import java.util.List;

public record ProductPageResponse(
        List<ProductResponse> items,
        List<ProductResponse> content,
        int page,
        int size,
        long total,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public ProductPageResponse(List<ProductResponse> items, int page, int size, long total) {
        this(items, items, page, size, total, total, totalPages(total, size), page == 0, page >= totalPages(total, size) - 1);
    }

    private static int totalPages(long total, int size) {
        if (total <= 0 || size <= 0) {
            return 0;
        }
        return (int) Math.ceil((double) total / size);
    }
}
