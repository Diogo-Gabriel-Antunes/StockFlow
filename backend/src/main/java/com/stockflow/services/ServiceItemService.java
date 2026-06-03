package com.stockflow.services;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.companies.CompanyRepository;
import com.stockflow.shared.security.AuthenticatedTenant;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.util.UUID;

@ApplicationScoped
public class ServiceItemService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    @Inject
    ServiceItemRepository serviceItemRepository;

    @Inject
    CompanyRepository companyRepository;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    public ServiceItemPageResponse list(String search, Integer page, Integer size) {
        int safePage = Math.max(page == null ? 0 : page, 0);
        int safeSize = Math.min(Math.max(size == null ? DEFAULT_PAGE_SIZE : size, 1), MAX_PAGE_SIZE);
        UUID companyId = authenticatedTenant.companyId();

        return new ServiceItemPageResponse(
                serviceItemRepository.listActiveByCompany(companyId, search, safePage, safeSize)
                        .stream()
                        .map(ServiceItemResponse::from)
                        .toList(),
                safePage,
                safeSize,
                serviceItemRepository.countActiveByCompany(companyId, search)
        );
    }

    public ServiceItemResponse get(UUID id) {
        return ServiceItemResponse.from(findCurrentCompanyService(id));
    }

    @Transactional
    public ServiceItemResponse create(ServiceItemRequest request) {
        CompanyEntity company = companyRepository.findByIdOptional(authenticatedTenant.companyId())
                .orElseThrow(NotFoundException::new);

        ServiceItemEntity service = new ServiceItemEntity();
        service.company = company;
        applyRequest(service, request);
        service.active = true;
        serviceItemRepository.persist(service);
        return ServiceItemResponse.from(service);
    }

    @Transactional
    public ServiceItemResponse update(UUID id, ServiceItemRequest request) {
        ServiceItemEntity service = findCurrentCompanyService(id);
        applyRequest(service, request);
        return ServiceItemResponse.from(service);
    }

    @Transactional
    public void delete(UUID id) {
        ServiceItemEntity service = findCurrentCompanyService(id);
        service.active = false;
    }

    private ServiceItemEntity findCurrentCompanyService(UUID id) {
        return serviceItemRepository.findActiveByCompanyAndId(authenticatedTenant.companyId(), id)
                .orElseThrow(NotFoundException::new);
    }

    private void applyRequest(ServiceItemEntity service, ServiceItemRequest request) {
        service.name = request.name().trim();
        service.description = trimToNull(request.description());
        service.defaultPrice = request.defaultPrice();
        service.estimatedCost = request.estimatedCost();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
