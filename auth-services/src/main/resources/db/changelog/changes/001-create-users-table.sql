--liquibase formatted sql

--changeset michael:001-create-users-table
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(20)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(75)  NOT NULL,
    last_name     VARCHAR(75)  NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT ck_users_role  CHECK (role IN ('CUSTOMER', 'MERCHANT', 'ADMIN'))
);