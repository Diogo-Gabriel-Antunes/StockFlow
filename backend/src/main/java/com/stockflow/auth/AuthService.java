package com.stockflow.auth;

import com.stockflow.companies.CompanyEntity;
import com.stockflow.companies.CompanyResponse;
import com.stockflow.companies.CompanyRepository;
import com.stockflow.shared.security.AuthenticatedTenant;
import com.stockflow.shared.security.JwtClaims;
import com.stockflow.shared.security.JwtService;
import com.stockflow.shared.security.PasswordHasher;
import com.stockflow.users.UserEntity;
import com.stockflow.users.UserRepository;
import com.stockflow.users.UserResponse;
import com.stockflow.users.UserRole;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.container.ContainerRequestContext;

@ApplicationScoped
public class AuthService {

    @Inject
    CompanyRepository companyRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    PasswordHasher passwordHasher;

    @Inject
    JwtService jwtService;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findActiveByEmail(request.email()).isPresent()) {
            throw new BadRequestException("E-mail already registered");
        }

        CompanyEntity company = new CompanyEntity();
        company.name = request.companyName().trim();
        company.tradeName = request.companyName().trim();
        company.document = trimToNull(request.companyDocument());
        company.email = trimToNull(request.companyEmail());
        company.phone = trimToNull(request.companyPhone());
        companyRepository.persist(company);

        UserEntity user = new UserEntity();
        user.company = company;
        user.name = request.ownerName().trim();
        user.email = UserEntity.normalizeEmail(request.email());
        user.passwordHash = passwordHasher.hash(request.password());
        user.role = UserRole.OWNER;
        user.active = true;
        userRepository.persist(user);

        String token = jwtService.createToken(user);
        return new AuthResponse(token, UserResponse.from(user), CompanyResponse.from(company));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findActiveByEmail(request.email())
                .orElseThrow(() -> new NotAuthorizedException("Invalid credentials"));

        if (!passwordHasher.verify(request.password(), user.passwordHash)) {
            throw new NotAuthorizedException("Invalid credentials");
        }

        return new AuthResponse(
                jwtService.createToken(user),
                UserResponse.from(user),
                CompanyResponse.from(user.company)
        );
    }

    @Transactional
    public MeResponse me(ContainerRequestContext requestContext) {
        JwtClaims claims = authenticatedTenant.claimsFromRequest(requestContext);
        UserEntity user = userRepository.findByIdOptional(claims.userId())
                .filter(found -> found.active)
                .orElseThrow(() -> new NotAuthorizedException("Invalid user"));

        if (!user.company.id.equals(claims.companyId())) {
            throw new NotAuthorizedException("Invalid tenant");
        }

        return new MeResponse(UserResponse.from(user), CompanyResponse.from(user.company));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
