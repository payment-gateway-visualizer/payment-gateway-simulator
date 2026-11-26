package com.paymentgateway.wallet_service.payment;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.paymentgateway.wallet_service.common.ApiException;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/payment-requests")
@RequiredArgsConstructor
public class PaymentRequestController {

    private final PaymentRequestService paymentRequestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    PaymentRequestResponse create(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreatePaymentRequest request) {
        String merchantName = jwt.getClaimAsString("name");
        if (merchantName == null || merchantName.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_OUTDATED");
        }

        UUID merchantId = UUID.fromString(jwt.getSubject());
        return PaymentRequestResponse.from(
                paymentRequestService.create(merchantId, merchantName, jwt.getTokenValue(), request));
    }
        @GetMapping
    PaymentRequestListResponse list(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(name = "status", required = false) PaymentRequest.Status status) {
        UUID userId = UUID.fromString(jwt.getSubject());
        boolean asMerchant = "MERCHANT".equals(jwt.getClaimAsString("role"));

        List<PaymentRequestResponse> items = paymentRequestService.list(userId, asMerchant, status)
                .stream()
                .map(PaymentRequestResponse::from)
                .toList();
        return new PaymentRequestListResponse(items);
    }
}
