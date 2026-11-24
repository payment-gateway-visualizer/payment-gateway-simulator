package com.paymentgateway.wallet_service.wallet;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;

    // The wallet is created automatically the first time its owner asks for it.
    public Wallet getOrCreate(UUID userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> create(userId));
    }

    private Wallet create(UUID userId) {
        try {
            Wallet wallet = walletRepository.saveAndFlush(new Wallet(userId));
            log.info("Created wallet for user {}", userId);
            return wallet;
        } catch (DataIntegrityViolationException e) {
            // Two first requests arrived at once and the other one won.
            // The database refused our duplicate, so we read the wallet it created.
            return walletRepository.findByUserId(userId).orElseThrow();
        }
    }
}