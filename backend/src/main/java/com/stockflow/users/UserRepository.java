package com.stockflow.users;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class UserRepository implements PanacheRepositoryBase<UserEntity, UUID> {

    public Optional<UserEntity> findActiveByEmail(String email) {
        return find("lower(email) = ?1 and active = true", UserEntity.normalizeEmail(email)).firstResultOptional();
    }
}
