package com.paymentgateway.wallet_service.wallet;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record TopUpRequest(
        @Min(1) @Max(15_000_000) long amountCents) {
}