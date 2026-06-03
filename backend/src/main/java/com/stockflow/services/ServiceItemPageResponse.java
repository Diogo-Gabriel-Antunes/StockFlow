package com.stockflow.services;

import java.util.List;

public record ServiceItemPageResponse(
        List<ServiceItemResponse> items,
        int page,
        int size,
        long total
) {
}
