package com.paymentgateway.wallet_service.payment;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePaymentRequest(
        @NotBlank @Size(max = 254) String customer,
        @Min(1) @Max(15_000_000) long amountCents,
        @NotBlank @Size(max = 140) String reason) {
}
