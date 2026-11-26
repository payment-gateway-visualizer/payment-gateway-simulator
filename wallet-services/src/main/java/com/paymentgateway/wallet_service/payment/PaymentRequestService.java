package com.paymentgateway.wallet_service.payment;

import java.util.UUID;

import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final AuthClient authClient;

    public PaymentRequest create(UUID merchantId, String merchantName, String callerToken,
            CreatePaymentRequest request) {
        CustomerInfo customer = authClient.findCustomer(request.customer().trim(), callerToken);

        return paymentRequestRepository.save(new PaymentRequest(merchantId, customer.id(),
                merchantName, customer.name(), request.amountCents(), request.reason().trim()));
    }
        @Transactional(readOnly = true)
    public List<PaymentRequest> list(UUID userId, boolean asMerchant, PaymentRequest.Status status) {
        if (asMerchant) {
            return status == null
                    ? paymentRequestRepository.findByMerchantIdOrderByCreatedAtDesc(userId)
                    : paymentRequestRepository.findByMerchantIdAndStatusOrderByCreatedAtDesc(userId, status);
        }
        return status == null
                ? paymentRequestRepository.findByCustomerIdOrderByCreatedAtDesc(userId)
                : paymentRequestRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(userId, status);
    }
}