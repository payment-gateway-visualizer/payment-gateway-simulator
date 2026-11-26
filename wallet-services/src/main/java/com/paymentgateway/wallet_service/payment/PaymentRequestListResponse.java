package com.paymentgateway.wallet_service.payment;

import java.util.List;

public record PaymentRequestListResponse(List<PaymentRequestResponse> items) {
}
