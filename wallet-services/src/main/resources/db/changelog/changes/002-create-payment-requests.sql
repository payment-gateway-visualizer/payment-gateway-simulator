CREATE TABLE payment_requests (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id     UUID          NOT NULL,
    customer_id     UUID          NOT NULL,
    merchant_name   VARCHAR(120)  NOT NULL,
    customer_name   VARCHAR(120)  NOT NULL,
    amount_cents    BIGINT        NOT NULL,
    reason          VARCHAR(140)  NOT NULL,
    status          VARCHAR(10)   NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    paid_at         TIMESTAMPTZ,

    CONSTRAINT ck_pr_amount   CHECK (amount_cents > 0 AND amount_cents <= 15000000),
    CONSTRAINT ck_pr_status   CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
    CONSTRAINT ck_pr_parties  CHECK (merchant_id <> customer_id)
);

CREATE INDEX idx_pr_customer_time ON payment_requests (customer_id, created_at DESC);
CREATE INDEX idx_pr_merchant_time ON payment_requests (merchant_id, created_at DESC);