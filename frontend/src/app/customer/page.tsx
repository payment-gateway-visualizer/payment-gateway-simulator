"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Protected from "@/components/Protected";

// Where Log out sends the user. Change this if your login page lives at another path.
const LOGIN_PATH = "/login";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type TxStatus = "success" | "failed" | "rejected";
type TxType = "payment" | "topup";
type TxMethod = "wallet" | "mpesa";
type TabKey = "dashboard" | "pending" | "history";
type StatusFilter = "all" | TxStatus;

interface Transaction {
  id: string;
  reference: string;
  type: TxType;
  merchant: string;
  description: string;
  amount: number; // KES, 2 decimal places
  status: TxStatus;
  method: TxMethod;
  createdAt: string; // ISO 8601
  failureReason?: string;
}

interface PendingPayment {
  id: string;
  reference: string;
  merchant: string;
  description: string;
  amount: number;
  requestedAt: string;
  expiresAt: string;
}

interface Notice {
  kind: "success" | "error";
  text: string;
}

/* -------------------------------------------------------------------------- */
/*  Mock data (replace with API calls - see CUSTOMER_PAGE.md)                 */
/* -------------------------------------------------------------------------- */

// false (default): a first-time customer starts with a zero balance and empty lists.
// A returning customer's real balance and history must come from the backend.
// true: preview the page filled with the sample data below.
const SHOW_SAMPLE_DATA = false;

// Fixed prototype clock, used only with sample data so the numbers read "Nov 2026".
const MOCK_NOW = new Date(2026, 10, 9, 9, 15);
const LOADED_AT = Date.now();
const clockNow = (): Date =>
  SHOW_SAMPLE_DATA ? new Date(MOCK_NOW.getTime() + (Date.now() - LOADED_AT)) : new Date();

const at = (month: number, day: number, hour: number, minute: number): string =>
  new Date(2026, month, day, hour, minute).toISOString();

const INITIAL_BALANCE = 18450;

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "tx_01", reference: "PP7K2M9QX1", type: "payment", merchant: "Kilimani Pharmacy", description: "Prescription refill", amount: 450, status: "success", method: "wallet", createdAt: at(10, 8, 18, 42) },
  { id: "tx_02", reference: "PP3H8D5TR4", type: "payment", merchant: "Java House", description: "Lunch - Yaya Centre", amount: 800, status: "success", method: "wallet", createdAt: at(10, 7, 13, 5) },
  { id: "tx_03", reference: "PP9L1C6WZ2", type: "payment", merchant: "Kilimani Pharmacy", description: "Vitamins and supplements", amount: 850, status: "success", method: "wallet", createdAt: at(10, 5, 10, 20) },
  { id: "tx_04", reference: "SK41A2B3C4", type: "topup", merchant: "Wallet top up", description: "Wallet top-up", amount: 5000, status: "success", method: "mpesa", createdAt: at(10, 4, 9, 0) },
  { id: "tx_05", reference: "PP2B7N4VK8", type: "payment", merchant: "Naivas Supermarket", description: "Groceries - order #NV-8790", amount: 2200, status: "success", method: "wallet", createdAt: at(10, 3, 17, 30) },
  { id: "tx_06", reference: "PP6F0J3SY5", type: "payment", merchant: "Kenya Power", description: "Prepaid tokens", amount: 1500, status: "failed", method: "wallet", createdAt: at(10, 3, 8, 10), failureReason: "The merchant did not confirm the payment in time." },
  { id: "tx_07", reference: "PP8D4Q1MA7", type: "payment", merchant: "Kilimani Pharmacy", description: "Invoice #KP-2204", amount: 1200, status: "success", method: "wallet", createdAt: at(10, 2, 11, 15) },
  { id: "tx_08", reference: "PP5R9T2LC3", type: "payment", merchant: "Quickmart", description: "Household items", amount: 650, status: "rejected", method: "wallet", createdAt: at(10, 1, 20, 0), failureReason: "You rejected this payment request." },
  { id: "tx_09", reference: "PP1G6Y8EH9", type: "payment", merchant: "Kenya Power", description: "Prepaid tokens", amount: 1500, status: "success", method: "wallet", createdAt: at(10, 1, 7, 45) },
  { id: "tx_10", reference: "PP4W3X7UJ6", type: "payment", merchant: "Naivas Supermarket", description: "Groceries - order #NV-8512", amount: 1100, status: "success", method: "wallet", createdAt: at(9, 28, 16, 10) },
];

const INITIAL_PENDING: PendingPayment[] = [
  { id: "pr_01", reference: "REQ-20931", merchant: "Kilimani Pharmacy", description: "Invoice #KP-2291", amount: 1350, requestedAt: at(10, 9, 9, 2), expiresAt: at(10, 10, 9, 2) },
  { id: "pr_02", reference: "REQ-20917", merchant: "Naivas Supermarket", description: "Groceries - order #NV-8841", amount: 3200, requestedAt: at(10, 8, 21, 40), expiresAt: at(10, 9, 21, 40) },
  { id: "pr_03", reference: "REQ-20888", merchant: "Zuku Fiber", description: "Home internet - November", amount: 2999, requestedAt: at(10, 7, 8, 0), expiresAt: at(10, 11, 8, 0) },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const kes = (n: number): string =>
  `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (iso: string): string =>
  `${fmtDate(iso)}, ${new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })}`;

const makeReference = (): string =>
  `PP${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const STATUS_LABEL: Record<TxStatus, string> = {
  success: "Successful",
  failed: "Failed",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<TxStatus, string> = {
  success: "bg-[#E6F6EC] text-[#14733A]",
  failed: "bg-[#FDE7EA] text-[#B4152E]",
  rejected: "bg-[#FFF1DB] text-[#9A5B00]",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pending", label: "Pending Payments" },
  { key: "history", label: "Transaction History" },
];

/** Reads the logged-in user's name from whatever shape Protected provides. */
function getDisplayName(user: unknown): string {
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    for (const key of ["name", "fullName", "full_name", "displayName", "username"]) {
      if (text(u[key])) return text(u[key]);
    }
    const joined = `${text(u.firstName)} ${text(u.lastName)}`.trim();
    if (joined) return joined;
    if (text(u.email)) return text(u.email).split("@")[0];
  }
  return "Customer";
}

/** A stable id for the logged-in user, so their data is kept per account. */
function getUserKey(user: unknown): string {
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    for (const key of ["id", "_id", "userId", "uid", "email", "username", "name"]) {
      const v = u[key];
      if (typeof v === "string" && v.trim()) return v.trim().toLowerCase();
      if (typeof v === "number") return String(v);
    }
  }
  return "unknown";
}

/* -------------------------------------------------------------------------- */
/*  Saved account data                                                        */
/*                                                                            */
/*  The balance and history belong to the ACCOUNT, not to the login. Logging  */
/*  out must never delete them, and logging back in loads them again.         */
/*  A user with nothing saved is a first-time user and starts at zero.        */
/*                                                                            */
/*  PROTOTYPE ONLY: this keeps the data in this browser. In production, load  */
/*  it from the backend (see the MD file), which works on any device. Make    */
/*  sure your logout removes only the login token and never clears these      */
/*  "pesapay:" keys.                                                          */
/* -------------------------------------------------------------------------- */

interface AccountData {
  balance: number;
  transactions: Transaction[];
  pending: PendingPayment[];
}

const storageKey = (userKey: string): string => `pesapay:customer:${userKey}`;

function loadAccount(userKey: string): AccountData | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userKey));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<AccountData>;
    if (
      typeof data.balance !== "number" ||
      !Array.isArray(data.transactions) ||
      !Array.isArray(data.pending)
    ) {
      return null;
    }
    return { balance: data.balance, transactions: data.transactions, pending: data.pending };
  } catch {
    return null;
  }
}

function saveAccount(userKey: string, data: AccountData): void {
  try {
    window.localStorage.setItem(storageKey(userKey), JSON.stringify(data));
  } catch {
    // Storage full or blocked: the page still works, it just will not be remembered.
  }
}

/* -------------------------------------------------------------------------- */
/*  Small presentational pieces                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: TxStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[13px] font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[2rem] border border-[#EBDDE0] bg-white p-4">
      <p className="text-[13px] font-medium uppercase tracking-wide text-[#5E4B51]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#2A0B14]">{value}</p>
      <p className="mt-1.5 text-[15px] text-[#6B5A5F]">{hint}</p>
    </div>
  );
}

function AmountText({ tx }: { tx: Transaction }) {
  const credit = tx.type === "topup" && tx.status === "success";
  const muted = tx.status !== "success";
  const color = credit ? "text-[#14733A]" : muted ? "text-[#8A7A7F] line-through" : "text-[#2A0B14]";
  return (
    <span className={`whitespace-nowrap text-base font-bold ${color}`}>
      {credit ? "+ " : tx.type === "payment" ? "- " : ""}
      {kes(tx.amount)}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2A0B14]/50 p-2.5 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2.5">
          <h2 className="text-xl font-extrabold tracking-tight text-[#2A0B14]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-lg text-[#6B5A5F] hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
          >
            &times;
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Receipt modal                                                             */
/* -------------------------------------------------------------------------- */

function ReceiptModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const rows: [string, string][] = [
    [tx.type === "topup" ? "Source" : "Merchant", tx.merchant],
    ["Description", tx.description],
    ["Reference", tx.reference],
    ["Method", tx.method === "mpesa" ? "M-Pesa" : "PesaPay wallet"],
    ["Date", fmtDateTime(tx.createdAt)],
  ];

  return (
    <Modal title={tx.type === "topup" ? "Top-up receipt" : "Payment receipt"} onClose={onClose}>
      <div className="rounded-2xl bg-[#FBF6F7] p-3 text-center">
        <p className="text-[13px] font-medium text-[#6B5A5F]">Amount</p>
        <p className="mt-1 text-2xl font-extrabold text-[#2A0B14]">{kes(tx.amount)}</p>
        <div className="mt-2">
          <StatusBadge status={tx.status} />
        </div>
      </div>

      <dl className="mt-3 divide-y divide-[#F1E6E8]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2">
            <dt className="text-[15px] text-[#6B5A5F]">{label}</dt>
            <dd className="text-right text-[15px] font-semibold text-[#2A0B14]">{value}</dd>
          </div>
        ))}
      </dl>

      {tx.failureReason && (
        <p className="mt-2.5 rounded-2xl bg-[#FDE7EA] px-2.5 py-2 text-[15px] text-[#B4152E]">{tx.failureReason}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-full border border-[#EBDDE0] px-3 py-2 text-[15px] font-semibold text-[#2A0B14] hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
        >
          Print receipt
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full bg-[#D92A42] px-3 py-2 text-[15px] font-semibold text-white hover:bg-[#C21F37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42] focus-visible:ring-offset-2"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top-up modal                                                              */
/* -------------------------------------------------------------------------- */

function TopUpModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 10 || value > 150000) {
      setError("Enter a whole amount between KES 10 and KES 150,000.");
      return;
    }
    setError("");
    setSubmitting(true);
    // Prototype only: replace with the real top-up API call (see CUSTOMER_PAGE.md).
    timer.current = window.setTimeout(() => onComplete(value), 1000);
  };

  return (
    <Modal title="Top up wallet" onClose={submitting ? () => undefined : onClose}>
      <form onSubmit={submit} noValidate>
        <label htmlFor="topup-amount" className="block text-[15px] font-semibold text-[#2A0B14]">
          Amount (KES)
        </label>
        <input
          id="topup-amount"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
          disabled={submitting}
          placeholder="e.g. 2000"
          autoFocus
          className="mt-1.5 w-full rounded-2xl border border-[#EBDDE0] px-2.5 py-2 text-base focus:border-[#D92A42] focus:outline-none focus:ring-2 focus:ring-[#D92A42]/30 disabled:bg-[#FBF6F7]"
        />

        {error && (
          <p role="alert" className="mt-2.5 text-[15px] font-medium text-[#B4152E]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-[#D92A42] px-3 py-2 text-base font-semibold text-white hover:bg-[#C21F37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {submitting ? "Processing..." : "Top up"}
        </button>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function CustomerView({ customerName, userKey }: { customerName: string; userKey: string }) {
  const router = useRouter();

  // Sessionless: Log out only goes to the login page. The account's saved data is kept.
  const onLogout = () => router.replace(LOGIN_PATH);

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [balance, setBalance] = useState<number>(SHOW_SAMPLE_DATA ? INITIAL_BALANCE : 0);
  const [transactions, setTransactions] = useState<Transaction[]>(SHOW_SAMPLE_DATA ? INITIAL_TRANSACTIONS : []);
  const [pending, setPending] = useState<PendingPayment[]>(SHOW_SAMPLE_DATA ? INITIAL_PENDING : []);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  // Which user's saved data is currently on screen (null until it has been loaded).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Returning user: restore their saved balance and history. First-time user: nothing saved, so zero.
  useEffect(() => {
    const saved = loadAccount(userKey);
    if (saved) {
      setBalance(saved.balance);
      setTransactions(saved.transactions);
      setPending(saved.pending);
    }
    setLoadedFor(userKey);
  }, [userKey]);

  // Save after every change, but only once this user's data has been loaded (never overwrite it with zeros).
  useEffect(() => {
    if (loadedFor !== userKey) return;
    saveAccount(userKey, { balance, transactions, pending });
  }, [loadedFor, userKey, balance, transactions, pending]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  /* ---- Derived dashboard numbers ---- */
  const stats = useMemo(() => {
    const inMonth = (iso: string) => {
      const d = new Date(iso);
      const ref = clockNow();
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
    };
    const monthPayments = transactions.filter((t) => t.type === "payment" && inMonth(t.createdAt));
    const successful = monthPayments.filter((t) => t.status === "success");

    const byMerchant = new Map<string, { count: number; total: number }>();
    successful.forEach((t) => {
      const entry = byMerchant.get(t.merchant) ?? { count: 0, total: 0 };
      byMerchant.set(t.merchant, { count: entry.count + 1, total: entry.total + t.amount });
    });
    const ranked = Array.from(byMerchant.entries())
      .map(([name, v]) => ({ name, count: v.count, total: v.total }))
      .sort((a, b) => b.count - a.count || b.total - a.total);
    const topMerchant: { name: string; count: number } | null = ranked.length
      ? { name: ranked[0].name, count: ranked[0].count }
      : null;

    return {
      spent: successful.reduce((sum, t) => sum + t.amount, 0),
      paymentsMade: successful.length,
      topMerchant,
      failedOrRejected: monthPayments.filter((t) => t.status !== "success").length,
      monthLabel: clockNow().toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
    };
  }, [transactions]);

  const recent = transactions.slice(0, 5);

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.merchant.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    });
  }, [transactions, statusFilter, query]);

  /* ---- Actions ---- */
  const approve = (p: PendingPayment) => {
    if (p.amount > balance) {
      setNotice({
        kind: "error",
        text: `Not enough wallet balance. Top up at least ${kes(p.amount - balance)} to approve this payment.`,
      });
      return;
    }
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      reference: makeReference(),
      type: "payment",
      merchant: p.merchant,
      description: p.description,
      amount: p.amount,
      status: "success",
      method: "wallet",
      createdAt: clockNow().toISOString(),
    };
    setBalance((b) => b - p.amount);
    setPending((list) => list.filter((x) => x.id !== p.id));
    setTransactions((list) => [tx, ...list]);
    setNotice({ kind: "success", text: `Paid ${kes(p.amount)} to ${p.merchant}.` });
  };

  const reject = (p: PendingPayment) => {
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      reference: makeReference(),
      type: "payment",
      merchant: p.merchant,
      description: p.description,
      amount: p.amount,
      status: "rejected",
      method: "wallet",
      createdAt: clockNow().toISOString(),
      failureReason: "You rejected this payment request.",
    };
    setPending((list) => list.filter((x) => x.id !== p.id));
    setTransactions((list) => [tx, ...list]);
    setNotice({ kind: "success", text: `Rejected the request from ${p.merchant}.` });
  };

  const completeTopUp = (amount: number) => {
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      reference: makeReference(),
      type: "topup",
      merchant: "Wallet top up",
      description: "Wallet top-up",
      amount,
      status: "success",
      method: "mpesa",
      createdAt: clockNow().toISOString(),
    };
    setBalance((b) => b + amount);
    setTransactions((list) => [tx, ...list]);
    setShowTopUp(false);
    setNotice({ kind: "success", text: `${kes(amount)} added to your wallet.` });
  };

  if (loadedFor !== userKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-sans text-lg text-[#6B5A5F]">
        Loading your account...
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="min-h-screen bg-white font-sans text-[#2A0B14]">
      {notice && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-[60] max-w-sm rounded-2xl px-3 py-2.5 text-[15px] font-semibold shadow-lg ${
            notice.kind === "success" ? "bg-[#14733A] text-white" : "bg-[#B4152E] text-white"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="w-full px-2.5 sm:px-4 lg:px-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-2.5 py-4">
          <a href="/customer" className="text-2xl font-extrabold tracking-tight text-[#2A0B14]">
            Pesa<span className="text-[#D92A42]">Pay</span>
          </a>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold">{customerName}</span>
              <span className="rounded-full bg-[#FBE9EC] px-2 py-1 text-[15px] font-medium text-[#D92A42]">Customer</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-[#EBDDE0] px-4 py-2 text-base font-semibold text-[#2A0B14] hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div role="tablist" aria-label="Customer sections" className="-mx-2.5 flex gap-1.5 overflow-x-auto border-b border-[#EBDDE0] px-2.5 sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`-mb-px whitespace-nowrap border-b-[3px] px-2.5 py-2.5 text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42] ${
                tab === t.key
                  ? "border-[#D92A42] text-[#D92A42]"
                  : "border-transparent text-[#5E4B51] hover:text-[#2A0B14]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <main className="pb-10 pt-6">
          {/* ------------------------------ Dashboard ------------------------------ */}
          {tab === "dashboard" && (
            <section role="tabpanel" id="panel-dashboard" aria-labelledby="tab-dashboard">
              <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Spent this month" value={kes(stats.spent)} hint={`${stats.monthLabel} so far`} />
                <StatCard label="Payments made" value={String(stats.paymentsMade)} hint="Successful payments" />
                <StatCard
                  label="Most-paid merchant"
                  value={stats.topMerchant ? stats.topMerchant.name : "None yet"}
                  hint={
                    stats.topMerchant
                      ? `${stats.topMerchant.count} payment${stats.topMerchant.count === 1 ? "" : "s"}`
                      : "Pay a merchant to see this"
                  }
                />
                <StatCard label="Failed or rejected" value={String(stats.failedOrRejected)} hint="Did not go through" />
              </div>

              <div className="mt-8 rounded-[2.5rem] bg-gradient-to-br from-[#D3213C] via-[#B31C35] to-[#7F1228] p-5 text-white sm:p-8">
                <p className="text-lg font-medium text-white/85">Wallet balance</p>
                <p className="mt-2 break-words text-4xl font-extrabold tracking-tight sm:text-6xl">{kes(balance)}</p>
                {balance === 0 && transactions.length === 0 && (
                  <p className="mt-2 text-base text-white/85">Welcome! Top up your wallet to start paying merchants.</p>
                )}
                <button
                  type="button"
                  onClick={() => setShowTopUp(true)}
                  className="mt-5 rounded-full bg-white px-5 py-2.5 text-lg font-semibold text-[#D92A42] hover:bg-[#FBE9EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#B31C35]"
                >
                  Top up
                </button>
              </div>

              <div className="mt-8 flex items-center justify-between gap-2.5">
                <h2 className="text-2xl font-extrabold tracking-tight">Recent transactions</h2>
                <button
                  type="button"
                  onClick={() => setTab("history")}
                  className="text-base font-semibold text-[#D92A42] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
                >
                  View all
                </button>
              </div>

              {recent.length === 0 ? (
                <div className="mt-4 rounded-[2rem] border border-dashed border-[#EBDDE0] px-4 py-10 text-center">
                  <p className="text-lg font-semibold">No transactions yet</p>
                  <p className="mt-1.5 text-base text-[#6B5A5F]">Your payments and top-ups will appear here.</p>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-[#F1E6E8] rounded-[2rem] border border-[#EBDDE0]">
                {recent.map((tx) => (
                  <li key={tx.id}>
                    <button
                      type="button"
                      onClick={() => setReceipt(tx)}
                      className="flex w-full flex-wrap items-center gap-2.5 px-4 py-3 text-left hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D92A42]"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FBE9EC] text-base font-bold text-[#D92A42]"
                      >
                        {tx.type === "topup" ? "+" : tx.merchant.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold">{tx.merchant}</span>
                        <span className="block truncate text-[15px] text-[#6B5A5F]">
                          {tx.description} - {fmtDateTime(tx.createdAt)}
                        </span>
                      </span>
                      <AmountText tx={tx} />
                      <StatusBadge status={tx.status} />
                    </button>
                  </li>
                ))}
              </ul>
              )}
            </section>
          )}

          {/* ---------------------------- Pending payments ---------------------------- */}
          {tab === "pending" && (
            <section role="tabpanel" id="panel-pending" aria-labelledby="tab-pending">
              <h1 className="text-3xl font-extrabold tracking-tight">Pending payments</h1>
              <p className="mt-2 text-base text-[#6B5A5F]">
                Merchants have asked you to pay these. Approve to pay from your wallet, or reject to decline.
              </p>

              {pending.length === 0 ? (
                <div className="mt-6 rounded-[2rem] border border-dashed border-[#EBDDE0] px-4 py-10 text-center">
                  <p className="text-lg font-semibold">No pending payments</p>
                  <p className="mt-1.5 text-base text-[#6B5A5F]">When a merchant sends you a payment request, it will show up here.</p>
                </div>
              ) : (
                <ul className="mt-6 grid gap-4 lg:grid-cols-2">
                  {pending.map((p) => (
                    <li key={p.id} className="rounded-[2rem] border border-[#EBDDE0] p-4">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-xl font-extrabold tracking-tight">{p.merchant}</p>
                          <p className="mt-1 text-base text-[#6B5A5F]">{p.description}</p>
                        </div>
                        <p className="whitespace-nowrap text-xl font-extrabold">{kes(p.amount)}</p>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-2.5 text-[15px]">
                        <div>
                          <dt className="text-[#6B5A5F]">Request no.</dt>
                          <dd className="font-semibold">{p.reference}</dd>
                        </div>
                        <div>
                          <dt className="text-[#6B5A5F]">Requested</dt>
                          <dd className="font-semibold">{fmtDateTime(p.requestedAt)}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-[#6B5A5F]">Expires</dt>
                          <dd className="font-semibold">{fmtDateTime(p.expiresAt)}</dd>
                        </div>
                      </dl>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => reject(p)}
                          className="flex-1 rounded-full border border-[#EBDDE0] px-3 py-2 text-base font-semibold hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => approve(p)}
                          className="flex-1 rounded-full bg-[#D92A42] px-3 py-2 text-base font-semibold text-white hover:bg-[#C21F37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42] focus-visible:ring-offset-2"
                        >
                          Approve and pay
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* --------------------------- Transaction history --------------------------- */}
          {tab === "history" && (
            <section role="tabpanel" id="panel-history" aria-labelledby="tab-history">
              <h1 className="text-3xl font-extrabold tracking-tight">Transaction history</h1>

              <div className="mt-5 flex flex-wrap items-end gap-2.5">
                <div className="min-w-[220px] flex-1">
                  <label htmlFor="history-search" className="block text-[15px] font-semibold">
                    Search
                  </label>
                  <input
                    id="history-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Merchant, reference or description"
                    className="mt-1.5 w-full rounded-full border border-[#EBDDE0] px-3 py-2 text-base focus:border-[#D92A42] focus:outline-none focus:ring-2 focus:ring-[#D92A42]/30"
                  />
                </div>
                <div>
                  <label htmlFor="history-status" className="block text-[15px] font-semibold">
                    Status
                  </label>
                  <select
                    id="history-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="mt-1.5 rounded-full border border-[#EBDDE0] bg-white px-3 py-2 text-base focus:border-[#D92A42] focus:outline-none focus:ring-2 focus:ring-[#D92A42]/30"
                  >
                    <option value="all">All</option>
                    <option value="success">Successful</option>
                    <option value="failed">Failed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="mt-5 rounded-[2rem] border border-dashed border-[#EBDDE0] px-4 py-10 text-center">
                  <p className="text-lg font-semibold">{transactions.length === 0 ? "No transactions yet" : "No transactions match"}</p>
                  <p className="mt-1.5 text-base text-[#6B5A5F]">
                    {transactions.length === 0
                      ? "Your payments and top-ups will appear here."
                      : "Clear the search or change the status filter to see more."}
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto rounded-[2rem] border border-[#EBDDE0]">
                  <table className="w-full min-w-[820px] text-left">
                    <thead className="bg-[#FBF6F7] text-[15px] text-[#5E4B51]">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Date</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Merchant</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Reference</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Method</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">Amount</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                        <th scope="col" className="px-4 py-2.5 font-semibold"><span className="sr-only">Receipt</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1E6E8]">
                      {filteredHistory.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#FBF6F7]">
                          <td className="whitespace-nowrap px-4 py-2.5 text-[15px] text-[#5E4B51]">{fmtDate(tx.createdAt)}</td>
                          <td className="px-4 py-2.5">
                            <span className="block text-[15px] font-semibold">{tx.merchant}</span>
                            <span className="block text-[13px] text-[#6B5A5F]">{tx.description}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-[15px]">{tx.reference}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-[15px]">{tx.method === "mpesa" ? "M-Pesa" : "Wallet"}</td>
                          <td className="px-4 py-2.5 text-right"><AmountText tx={tx} /></td>
                          <td className="px-4 py-2.5"><StatusBadge status={tx.status} /></td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setReceipt(tx)}
                              className="whitespace-nowrap text-[15px] font-semibold text-[#D92A42] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
                            >
                              View receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {receipt && <ReceiptModal tx={receipt} onClose={() => setReceipt(null)} />}
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} onComplete={completeTopUp} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Next.js page: only logged-in customers see this, with their own name      */
/* -------------------------------------------------------------------------- */

export default function CustomerPage() {
  return (
    <Protected role="customer">
      {(user) => <CustomerView customerName={getDisplayName(user)} userKey={getUserKey(user)} />}
    </Protected>
  );
}