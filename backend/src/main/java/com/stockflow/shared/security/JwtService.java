package com.stockflow.shared.security;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockflow.users.UserEntity;
import com.stockflow.users.UserRole;
import io.smallrye.config.ConfigMapping;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@ApplicationScoped
public class JwtService {

    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();

    @Inject
    ObjectMapper objectMapper;

    @Inject
    JwtSettings settings;

    public String createToken(UserEntity user) {
        long now = Instant.now().getEpochSecond();

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("iss", settings.issuer());
        payload.put("sub", user.id.toString());
        payload.put("user_id", user.id.toString());
        payload.put("company_id", user.company.id.toString());
        payload.put("email", user.email);
        payload.put("role", user.role.name());
        payload.put("iat", now);
        payload.put("exp", now + settings.expiresIn());

        String headerPart = encodeJson(header);
        String payloadPart = encodeJson(payload);
        String signingInput = headerPart + "." + payloadPart;
        return signingInput + "." + sign(signingInput);
    }

    public JwtClaims verify(String token) {
        String[] parts = token == null ? new String[0] : token.split("\\.");
        if (parts.length != 3) {
            throw new InvalidTokenException();
        }

        String signingInput = parts[0] + "." + parts[1];
        if (!constantTimeEquals(sign(signingInput), parts[2])) {
            throw new InvalidTokenException();
        }

        Map<String, Object> payload = decodeJson(parts[1]);
        if (!settings.issuer().equals(payload.get("iss"))) {
            throw new InvalidTokenException();
        }

        long expiresAt = ((Number) payload.get("exp")).longValue();
        if (Instant.now().getEpochSecond() >= expiresAt) {
            throw new InvalidTokenException();
        }

        return new JwtClaims(
                UUID.fromString((String) payload.get("user_id")),
                UUID.fromString((String) payload.get("company_id")),
                (String) payload.get("email"),
                UserRole.valueOf((String) payload.get("role"))
        );
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            return BASE64_URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not encode JWT", exception);
        }
    }

    private Map<String, Object> decodeJson(String value) {
        try {
            return objectMapper.readValue(
                    BASE64_URL_DECODER.decode(value),
                    new TypeReference<Map<String, Object>>() {
                    }
            );
        } catch (Exception exception) {
            throw new InvalidTokenException();
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(settings.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return BASE64_URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not sign JWT", exception);
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = actual.getBytes(StandardCharsets.UTF_8);
        if (expectedBytes.length != actualBytes.length) {
            return false;
        }

        int result = 0;
        for (int i = 0; i < expectedBytes.length; i++) {
            result |= expectedBytes[i] ^ actualBytes[i];
        }
        return result == 0;
    }

    public static class InvalidTokenException extends RuntimeException {
    }

    @ConfigMapping(prefix = "stockflow.jwt")
    public interface JwtSettings {
        String secret();

        String issuer();

        long expiresIn();
    }
}
