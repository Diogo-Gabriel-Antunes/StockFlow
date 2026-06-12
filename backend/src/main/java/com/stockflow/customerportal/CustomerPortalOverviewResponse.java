package com.stockflow.customerportal;

import com.stockflow.companies.CompanySettingsResponse;
import com.stockflow.customers.CustomerEntity;

import java.util.UUID;

public record CustomerPortalOverviewResponse(
        CustomerPortalCustomerResponse customer,
        CustomerPortalCompanyResponse company,
        CustomerPortalSummaryResponse summary
) {
    public static CustomerPortalOverviewResponse from(CustomerEntity customer, long openQuotes, long completedQuotes, long quoteRequests) {
        return new CustomerPortalOverviewResponse(
                new CustomerPortalCustomerResponse(
                        customer.id,
                        customer.name,
                        customer.document,
                        customer.email,
                        customer.phone
                ),
                new CustomerPortalCompanyResponse(
                        CompanySettingsResponse.commercialName(customer.company),
                        customer.company.document,
                        customer.company.email,
                        customer.company.phone,
                        customer.company.whatsapp,
                        customer.company.city,
                        customer.company.state
                ),
                new CustomerPortalSummaryResponse(openQuotes, completedQuotes, quoteRequests)
        );
    }

    public record CustomerPortalCustomerResponse(
            UUID id,
            String name,
            String document,
            String email,
            String phone
    ) {
    }

    public record CustomerPortalCompanyResponse(
            String tradeName,
            String document,
            String email,
            String phone,
            String whatsapp,
            String city,
            String state
    ) {
    }

    public record CustomerPortalSummaryResponse(
            long openQuotes,
            long completedQuotes,
            long quoteRequests
    ) {
    }
}
