package com.stockflow.customers;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.companies.CompanyRepository;
import com.stockflow.shared.security.AuthenticatedTenant;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.util.UUID;

@ApplicationScoped
public class CustomerService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    CustomerRepository customerRepository;

    @Inject
    CompanyRepository companyRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    public CustomerPageResponse list(String search, Integer page, Integer size) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();

        return new CustomerPageResponse(
                customerRepository.listActiveByCompany(companyId, search, safePage, safeSize)
                        .stream()
                        .map(CustomerResponse::from)
                        .toList(),
                safePage,
                safeSize,
                customerRepository.countActiveByCompany(companyId, search)
        );
    }

    public CustomerResponse get(UUID id) {
        return CustomerResponse.from(findCurrentCompanyCustomer(id));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        CompanyEntity company = companyRepository.findByIdOptional(authenticatedTenant.companyId())
                .orElseThrow(NotFoundException::new);

        CustomerEntity customer = new CustomerEntity();
        customer.company = company;
        applyRequest(customer, request);
        customer.active = true;
        customerRepository.persist(customer);
        return CustomerResponse.from(customer);
    }

    @Transactional
    public CustomerResponse update(UUID id, CustomerRequest request) {
        CustomerEntity customer = findCurrentCompanyCustomer(id);
        applyRequest(customer, request);
        return CustomerResponse.from(customer);
    }

    @Transactional
    public void delete(UUID id) {
        CustomerEntity customer = findCurrentCompanyCustomer(id);
        customer.active = false;
    }

    private CustomerEntity findCurrentCompanyCustomer(UUID id) {
        return customerRepository.findActiveByCompanyAndId(authenticatedTenant.companyId(), id)
                .orElseThrow(NotFoundException::new);
    }

    private void applyRequest(CustomerEntity customer, CustomerRequest request) {
        customer.name = request.name().trim();
        customer.type = request.type();
        customer.document = trimToNull(request.document());
        customer.email = trimToNull(request.email());
        customer.phone = trimToNull(request.phone());
        customer.whatsapp = trimToNull(request.whatsapp());
        customer.city = trimToNull(request.city());
        customer.state = request.state() == null ? null : request.state().trim().toUpperCase();
        customer.notes = trimToNull(request.notes());
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
