package com.stockflow.companies;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.UUID;

@ApplicationScoped
public class CompanyRepository implements PanacheRepositoryBase<CompanyEntity, UUID> {
}
