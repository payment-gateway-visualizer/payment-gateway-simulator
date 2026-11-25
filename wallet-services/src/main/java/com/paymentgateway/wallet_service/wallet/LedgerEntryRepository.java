package com.paymentgateway.wallet_service.wallet;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
}
