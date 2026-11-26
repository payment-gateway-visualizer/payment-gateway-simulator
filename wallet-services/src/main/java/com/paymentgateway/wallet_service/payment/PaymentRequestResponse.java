package com.paymentgateway.wallet_service.payment;

import java.time.Instant;
import java.util.UUID;

public record PaymentRequestResponse(
        UUID id,
        String merchantName,
        String customerName,
        long amountCents,
        String reason,
        PaymentRequest.Status status,
        Instant createdAt,
        Instant paidAt) {

    public static PaymentRequestResponse from(PaymentRequest p) {
        return new PaymentRequestResponse(p.getId(), p.getMerchantName(), p.getCustomerName(),
                p.getAmountCents(), p.getReason(), p.getStatus(), p.getCreatedAt(), p.getPaidAt());
    }
}
