package com.paymentgateway.wallet_service.wallet;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.paymentgateway.wallet_service.wallet.LedgerEntry.BalanceType;
import com.paymentgateway.wallet_service.wallet.LedgerEntry.Direction;
import com.paymentgateway.wallet_service.wallet.LedgerEntry.EntryType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

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
            return walletRepository.findByUserId(userId).orElseThrow();
        }
    }

    // Adds mock money. The balance change and the ledger entry succeed together or not at all.
    @Transactional
    public Wallet topUp(UUID userId, long amountCents) {
        Wallet wallet = walletRepository.findWithLockByUserId(userId)
                .orElseGet(() -> walletRepository.save(new Wallet(userId)));

        wallet.credit(amountCents);

        ledgerEntryRepository.save(new LedgerEntry(
                UUID.randomUUID(), wallet.getId(),
                EntryType.TOP_UP, Direction.CREDIT, BalanceType.AVAILABLE,
                amountCents, wallet.getAvailableCents()));

        log.info("Top-up of {} cents for wallet {}", amountCents, wallet.getId());
        return wallet;
    }
}