package com.stockflow.shared.security;

import com.stockflow.users.UserRole;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.NotAuthorizedException;
import java.util.UUID;

@ApplicationScoped
public class AuthenticatedTenant {

    public static final String USER_ID_PROPERTY = "stockflow.auth.userId";
    public static final String COMPANY_ID_PROPERTY = "stockflow.auth.companyId";
    public static final String EMAIL_PROPERTY = "stockflow.auth.email";
    public static final String ROLE_PROPERTY = "stockflow.auth.role";

    private final ThreadLocal<Session> session = new ThreadLocal<>();

    public void authenticate(UUID userId, UUID companyId, String email, UserRole role) {
        session.set(new Session(userId, companyId, email, role));
    }

    public void clear() {
        session.remove();
    }

    public boolean isAuthenticated() {
        return session.get() != null;
    }

    public UUID userId() {
        return requireAuthenticated().userId();
    }

    public UUID companyId() {
        return requireAuthenticated().companyId();
    }

    public String email() {
        return requireAuthenticated().email();
    }

    public UserRole role() {
        return requireAuthenticated().role();
    }

    private Session requireAuthenticated() {
        Session currentSession = session.get();
        if (currentSession == null) {
            throw new NotAuthorizedException("Authentication required");
        }
        return currentSession;
    }

    public JwtClaims claimsFromRequest(ContainerRequestContext requestContext) {
        Object userId = requestContext.getProperty(USER_ID_PROPERTY);
        Object companyId = requestContext.getProperty(COMPANY_ID_PROPERTY);
        Object email = requestContext.getProperty(EMAIL_PROPERTY);
        Object role = requestContext.getProperty(ROLE_PROPERTY);

        if (userId instanceof UUID userUuid
                && companyId instanceof UUID companyUuid
                && email instanceof String emailValue
                && role instanceof UserRole userRole) {
            return new JwtClaims(userUuid, companyUuid, emailValue, userRole);
        }

        throw new NotAuthorizedException("Authentication required");
    }

    private record Session(UUID userId, UUID companyId, String email, UserRole role) {
    }
}
