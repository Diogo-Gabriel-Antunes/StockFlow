package com.stockflow.shared.security;

import com.stockflow.shared.security.JwtService.InvalidTokenException;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.AUTHENTICATION)
@ApplicationScoped
public class AuthFilter implements ContainerRequestFilter {

    @Inject
    JwtService jwtService;

    @Inject
    AuthenticatedTenant authenticatedTenant;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        authenticatedTenant.clear();

        if (isPublicRequest(requestContext)) {
            return;
        }

        String authorization = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            abortUnauthorized(requestContext);
            return;
        }

        try {
            JwtClaims claims = jwtService.verify(authorization.substring("Bearer ".length()).trim());
            requestContext.setProperty(AuthenticatedTenant.USER_ID_PROPERTY, claims.userId());
            requestContext.setProperty(AuthenticatedTenant.COMPANY_ID_PROPERTY, claims.companyId());
            requestContext.setProperty(AuthenticatedTenant.EMAIL_PROPERTY, claims.email());
            requestContext.setProperty(AuthenticatedTenant.ROLE_PROPERTY, claims.role());
            authenticatedTenant.authenticate(claims.userId(), claims.companyId(), claims.email(), claims.role());
        } catch (InvalidTokenException exception) {
            abortUnauthorized(requestContext);
        }
    }

    private boolean isPublicRequest(ContainerRequestContext requestContext) {
        String method = requestContext.getMethod();
        String path = requestContext.getUriInfo().getPath();
        if (path != null && path.startsWith("/")) {
            path = path.substring(1);
        }
        return "OPTIONS".equalsIgnoreCase(method)
                || path == null
                || path.isBlank()
                || path.equals("/")
                || path.startsWith("q/")
                || path.equals("auth/register")
                || path.equals("auth/login")
                || path.startsWith("public/");
    }

    private void abortUnauthorized(ContainerRequestContext requestContext) {
        requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED).build());
    }
}
