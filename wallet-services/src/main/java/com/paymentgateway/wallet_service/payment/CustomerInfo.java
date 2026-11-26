package com.paymentgateway.wallet_service.payment;

import java.util.UUID;

// What the auth service tells us about a customer: nothing more.
public record CustomerInfo(UUID id, String name) {
}
