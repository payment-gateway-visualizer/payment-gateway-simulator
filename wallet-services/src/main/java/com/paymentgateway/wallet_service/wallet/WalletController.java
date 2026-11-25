package com.paymentgateway.wallet_service.wallet;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/me")
    WalletResponse me(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return WalletResponse.from(walletService.getOrCreate(userId));
    }

    @PostMapping("/me/top-up")
    WalletResponse topUp(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TopUpRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return WalletResponse.from(walletService.topUp(userId, request.amountCents()));
    }
}