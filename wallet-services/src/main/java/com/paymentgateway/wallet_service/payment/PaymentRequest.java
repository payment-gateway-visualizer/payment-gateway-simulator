package com.paymentgateway.wallet_service.payment;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "payment_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentRequest {

    public enum Status { PENDING, PAID, FAILED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "merchant_id", nullable = false, updatable = false)
    private UUID merchantId;

    @Column(name = "customer_id", nullable = false, updatable = false)
    private UUID customerId;

    @Column(name = "merchant_name", nullable = false, updatable = false, length = 120)
    private String merchantName;

    @Column(name = "customer_name", nullable = false, updatable = false, length = 120)
    private String customerName;

    @Column(name = "amount_cents", nullable = false, updatable = false)
    private long amountCents;

    @Column(nullable = false, updatable = false, length = 140)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    public PaymentRequest(UUID merchantId, UUID customerId, String merchantName,
            String customerName, long amountCents, String reason) {
        this.merchantId = merchantId;
        this.customerId = customerId;
        this.merchantName = merchantName;
        this.customerName = customerName;
        this.amountCents = amountCents;
        this.reason = reason;
        this.status = Status.PENDING;
        this.createdAt = Instant.now();
    }
}
