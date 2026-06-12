package com.stockflow.customerportal;

import java.util.List;

public record CustomerPortalProductPageResponse(
        List<CustomerPortalProductResponse> items,
        List<CustomerPortalProductResponse> content,
        int page,
        int size,
        long total,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public CustomerPortalProductPageResponse(List<CustomerPortalProductResponse> items, int page, int size, long total) {
        this(
                items,
                items,
                page,
                size,
                total,
                total,
                size <= 0 ? 0 : (int) Math.ceil((double) total / size),
                page == 0,
                size <= 0 || page >= Math.max((int) Math.ceil((double) total / size) - 1, 0)
        );
    }
}
