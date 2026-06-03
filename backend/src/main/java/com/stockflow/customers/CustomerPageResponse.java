package com.stockflow.customers;

import java.util.List;

public record CustomerPageResponse(
        List<CustomerResponse> items,
        int page,
        int size,
        long total
) {
}
