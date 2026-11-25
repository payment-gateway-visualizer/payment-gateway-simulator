package com.paymentgateway.wallet_service.wallet;

import java.util.UUID;

public record WalletResponse(UUID id, long availableCents, long pendingCents, String currency) {

    public static WalletResponse from(Wallet wallet) {
        return new WalletResponse(wallet.getId(), wallet.getAvailableCents(),
                wallet.getPendingCents(), wallet.getCurrency());
    }
}
