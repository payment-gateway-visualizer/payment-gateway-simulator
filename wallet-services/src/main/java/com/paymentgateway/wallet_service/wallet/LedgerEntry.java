package com.paymentgateway.wallet_service.wallet;

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
@Table(name = "ledger_entries")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LedgerEntry {

    public enum EntryType { TOP_UP, PAYMENT, SETTLEMENT, REVERSAL }

    public enum Direction { CREDIT, DEBIT }

    public enum BalanceType { AVAILABLE, PENDING }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "transaction_id", nullable = false, updatable = false)
    private UUID transactionId;

    @Column(name = "wallet_id", nullable = false, updatable = false)
    private UUID walletId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, updatable = false, length = 20)
    private EntryType entryType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 6)
    private Direction direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "balance_type", nullable = false, updatable = false, length = 9)
    private BalanceType balanceType;

    @Column(name = "amount_cents", nullable = false, updatable = false)
    private long amountCents;

    @Column(name = "balance_after_cents", nullable = false, updatable = false)
    private long balanceAfterCents;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public LedgerEntry(UUID transactionId, UUID walletId, EntryType entryType, Direction direction,
            BalanceType balanceType, long amountCents, long balanceAfterCents) {
        this.transactionId = transactionId;
        this.walletId = walletId;
        this.entryType = entryType;
        this.direction = direction;
        this.balanceType = balanceType;
        this.amountCents = amountCents;
        this.balanceAfterCents = balanceAfterCents;
        this.createdAt = Instant.now();
    }
}
