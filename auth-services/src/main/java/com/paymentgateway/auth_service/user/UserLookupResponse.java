package com.paymentgateway.auth_service.user;

import java.util.UUID;

public record UserLookupResponse(UUID id, String name) {

    public static UserLookupResponse from(User user) {
        return new UserLookupResponse(user.getId(), user.getFirstName() + " " + user.getLastName());
    }
}
