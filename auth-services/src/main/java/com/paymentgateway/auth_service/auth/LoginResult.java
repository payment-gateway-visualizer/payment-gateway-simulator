package com.paymentgateway.auth_service.auth;

public record LoginResult(String token, String role, String firstName, long expiresInSeconds) {
    public LoginResponse toResponse() {
        return new LoginResponse(role, firstName, expiresInSeconds);
    }
}
