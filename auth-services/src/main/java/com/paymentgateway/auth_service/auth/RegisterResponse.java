package com.paymentgateway.auth_service.auth;

import com.paymentgateway.auth_service.user.User;

public record RegisterResponse(
        String id,
        String email,
        String firstName,
        String role
) {
    public static RegisterResponse from(User user) {
        return new RegisterResponse(
                user.getId().toString(),
                user.getEmail(),
                user.getFirstName(),
                user.getRole().name()
        );
    }
}

