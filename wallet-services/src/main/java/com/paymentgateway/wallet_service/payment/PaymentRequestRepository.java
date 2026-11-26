package com.paymentgateway.wallet_service.payment;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, UUID> {

    List<PaymentRequest> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);

    List<PaymentRequest> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    List<PaymentRequest> findByMerchantIdAndStatusOrderByCreatedAtDesc(UUID merchantId, PaymentRequest.Status status);

    List<PaymentRequest> findByCustomerIdAndStatusOrderByCreatedAtDesc(UUID customerId, PaymentRequest.Status status);
}