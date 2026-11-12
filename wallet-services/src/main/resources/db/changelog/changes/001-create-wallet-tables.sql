CREATE TABLE wallets (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    available_cents BIGINT       NOT NULL DEFAULT 0,
    pending_cents   BIGINT       NOT NULL DEFAULT 0,
    currency        VARCHAR(3)   NOT NULL DEFAULT 'KES',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_wallets_user      UNIQUE (user_id),
    CONSTRAINT ck_wallets_available CHECK (available_cents >= 0),
    CONSTRAINT ck_wallets_pending   CHECK (pending_cents >= 0)
);

CREATE TABLE ledger_entries (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id      UUID         NOT NULL,
    wallet_id           UUID         NOT NULL REFERENCES wallets (id),
    entry_type          VARCHAR(20)  NOT NULL,
    direction           VARCHAR(6)   NOT NULL,
    balance_type        VARCHAR(9)   NOT NULL,
    amount_cents        BIGINT       NOT NULL,
    balance_after_cents BIGINT       NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ck_ledger_amount       CHECK (amount_cents > 0),
    CONSTRAINT ck_ledger_direction    CHECK (direction IN ('CREDIT', 'DEBIT')),
    CONSTRAINT ck_ledger_balance_type CHECK (balance_type IN ('AVAILABLE', 'PENDING')),
    CONSTRAINT ck_ledger_type         CHECK (entry_type IN ('TOP_UP', 'PAYMENT', 'SETTLEMENT', 'REVERSAL'))
);

CREATE INDEX idx_ledger_wallet_time ON ledger_entries (wallet_id, created_at DESC);