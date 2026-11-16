package com.paymentgateway.auth_service.auth;

public record LoginResponse(String role, String firstName, long expiresInSeconds) {
}
