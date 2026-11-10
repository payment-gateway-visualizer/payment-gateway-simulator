"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Protected from "@/components/Protected";

// Where Log out sends the user. Change this if your login page lives at another path.
const LOGIN_PATH = "/login";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type TxStatus = "success" | "failed" | "rejected" | "expired" | "cancelled";
type TabKey = "dashboard" | "requests" | "history";
type StatusFilter = "all" | TxStatus;

interface Transaction {
  id: string;
  requestNo: string;
  reference: string | null; // payment reference, only when a payment was attempted or made
  customer: string;
  description: string;
  amount: number; // KES, 2 decimal places
  status: TxStatus;
  requestedAt: string; // ISO 8601
  settledAt: string; // ISO 8601: when it was paid, rejected, expired, cancelled or failed
  note?: string;
}

interface PaymentRequest {
  id: string;
  requestNo: string;
  customer: string;
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
/*  Mock data (replace with API calls - see MERCHANT_PAGE.md)                 */
/* -------------------------------------------------------------------------- */

// false (default): a first-time merchant starts with a zero balance and empty lists.
// A returning merchant's real balance and history must come from the backend.
// true: preview the page filled with the sample data below.
const SHOW_SAMPLE_DATA = false;

// Fixed prototype clock, used only with sample data so the numbers read "Nov 2026".
const MOCK_NOW = new Date(2026, 10, 9, 9, 15);
const LOADED_AT = Date.now();
const clockNow = (): Date =>
  SHOW_SAMPLE_DATA ? new Date(MOCK_NOW.getTime() + (Date.now() - LOADED_AT)) : new Date();

const at = (month: number, day: number, hour: number, minute: number): string =>
  new Date(2026, month, day, hour, minute).toISOString();

const INITIAL_BALANCE = 52870;

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "tx_01", requestNo: "REQ-20899", reference: "PP7K2M9QX1", customer: "Wanjiku Kamau", description: "Prescription refill", amount: 450, status: "success", requestedAt: at(10, 8, 18, 30), settledAt: at(10, 8, 18, 42) },
  { id: "tx_02", requestNo: "REQ-20894", reference: "PP3C5N8ZA2", customer: "Brian Otieno", description: "Invoice #KP-2288", amount: 2300, status: "success", requestedAt: at(10, 8, 10, 55), settledAt: at(10, 8, 11, 20) },
  { id: "tx_03", requestNo: "REQ-20881", reference: "PP6T2V9KD1", customer: "Aisha Mohamed", description: "Over-the-counter medication", amount: 780, status: "success", requestedAt: at(10, 6, 14, 50), settledAt: at(10, 6, 15, 5) },
  { id: "tx_04", requestNo: "REQ-20862", reference: "PP9L1C6WZ2", customer: "Wanjiku Kamau", description: "Vitamins and supplements", amount: 850, status: "success", requestedAt: at(10, 5, 10, 5), settledAt: at(10, 5, 10, 20) },
  { id: "tx_05", requestNo: "REQ-20857", reference: null, customer: "Peter Mwangi", description: "Invoice #KP-2270", amount: 1600, status: "rejected", requestedAt: at(10, 4, 12, 0), settledAt: at(10, 4, 19, 30), note: "The customer rejected this request." },
  { id: "tx_06", requestNo: "REQ-20849", reference: "PP4M8R1BX7", customer: "Grace Njeri", description: "Invoice #KP-2266", amount: 3400, status: "success", requestedAt: at(10, 3, 9, 10), settledAt: at(10, 3, 13, 30) },
  { id: "tx_07", requestNo: "REQ-20843", reference: null, customer: "Faith Achieng", description: "Invoice #KP-2261", amount: 920, status: "expired", requestedAt: at(10, 2, 12, 0), settledAt: at(10, 3, 12, 0), note: "The request expired before it was paid." },
  { id: "tx_08", requestNo: "REQ-20830", reference: "PP2Q7W5HN3", customer: "David Kiprop", description: "Invoice #KP-2252", amount: 1150, status: "success", requestedAt: at(10, 2, 16, 20), settledAt: at(10, 2, 16, 45) },
  { id: "tx_09", requestNo: "REQ-20828", reference: "PP8D4Q1MA7", customer: "Wanjiku Kamau", description: "Invoice #KP-2204", amount: 1200, status: "success", requestedAt: at(10, 2, 11, 0), settledAt: at(10, 2, 11, 15) },
  { id: "tx_10", requestNo: "REQ-20815", reference: "PP1Z9X3LF6", customer: "Grace Njeri", description: "Delivery fee", amount: 540, status: "failed", requestedAt: at(10, 1, 18, 0), settledAt: at(10, 1, 18, 5), note: "The payment could not be completed." },
  { id: "tx_11", requestNo: "REQ-20809", reference: null, customer: "Brian Otieno", description: "Invoice #KP-2241", amount: 700, status: "cancelled", requestedAt: at(10, 1, 9, 30), settledAt: at(10, 1, 10, 0), note: "You cancelled this request." },
  { id: "tx_12", requestNo: "REQ-20760", reference: "PP5K3E8YT4", customer: "Aisha Mohamed", description: "Invoice #KP-2215", amount: 1250, status: "success", requestedAt: at(9, 29, 13, 40), settledAt: at(9, 29, 14, 0) },
];

const INITIAL_REQUESTS: PaymentRequest[] = [
  { id: "pr_01", requestNo: "REQ-20931", customer: "Wanjiku Kamau", description: "Invoice #KP-2291", amount: 1350, requestedAt: at(10, 9, 9, 2), expiresAt: at(10, 10, 9, 2) },
  { id: "pr_02", requestNo: "REQ-20927", customer: "Samuel Kariuki", description: "Invoice #KP-2289", amount: 2750, requestedAt: at(10, 8, 14, 10), expiresAt: at(10, 11, 14, 10) },
  { id: "pr_03", requestNo: "REQ-20922", customer: "Mercy Wambui", description: "Invoice #KP-2287", amount: 480, requestedAt: at(10, 7, 17, 0), expiresAt: at(10, 10, 17, 0) },
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

const PHONE_PATTERN = /^(?:\+?254|0)[71]\d{8}$/;

/** Turns 254712345678 / +254712345678 / 0712345678 into "0712 *** 678". */
const maskPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").replace(/^254/, "0");
  return `${digits.slice(0, 4)} *** ${digits.slice(-3)}`;
};

const STATUS_LABEL: Record<TxStatus, string> = {
  success: "Paid",
  failed: "Failed",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<TxStatus, string> = {
  success: "bg-[#E6F6EC] text-[#14733A]",
  failed: "bg-[#FDE7EA] text-[#B4152E]",
  rejected: "bg-[#FFF1DB] text-[#9A5B00]",
  expired: "bg-[#F1ECED] text-[#5E4B51]",
  cancelled: "bg-[#F1ECED] text-[#5E4B51]",
};

const EXPIRY_OPTIONS: { hours: number; label: string }[] = [
  { hours: 1, label: "1 hour" },
  { hours: 24, label: "24 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "requests", label: "Payment Requests" },
  { key: "history", label: "Transaction History" },
];

/** Reads the logged-in user's name from whatever shape Protected provides. */
function getDisplayName(user: unknown): string {
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
    for (const key of ["businessName", "name", "fullName", "full_name", "displayName", "username"]) {
      if (text(u[key])) return text(u[key]);
    }
    const joined = `${text(u.firstName)} ${text(u.lastName)}`.trim();
    if (joined) return joined;
    if (text(u.email)) return text(u.email).split("@")[0];
  }
  return "Merchant";
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
  requests: PaymentRequest[];
}

const storageKey = (userKey: string): string => `pesapay:merchant:${userKey}`;

function loadAccount(userKey: string): AccountData | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userKey));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<AccountData>;
    if (
      typeof data.balance !== "number" ||
      !Array.isArray(data.transactions) ||
      !Array.isArray(data.requests)
    ) {
      return null;
    }
    return { balance: data.balance, transactions: data.transactions, requests: data.requests };
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
  const paid = tx.status === "success";
  return (
    <span
      className={`whitespace-nowrap text-base font-bold ${paid ? "text-[#14733A]" : "text-[#8A7A7F] line-through"}`}
    >
      {paid ? "+ " : ""}
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2A0B14]/50 p-3 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-extrabold tracking-tight text-[#2A0B14]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 text-lg text-[#6B5A5F] hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
          >
            &times;
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Receipt modal                                                             */
/* -------------------------------------------------------------------------- */

function ReceiptModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const rows: [string, string][] = [
    ["Customer", tx.customer],
    ["Description", tx.description],
    ["Request no.", tx.requestNo],
  ];
  if (tx.reference) rows.push(["Reference", tx.reference]);
  rows.push(["Requested", fmtDateTime(tx.requestedAt)]);
  rows.push([tx.status === "success" ? "Paid" : "Closed", fmtDateTime(tx.settledAt)]);

  return (
    <Modal title={tx.status === "success" ? "Payment receipt" : "Request details"} onClose={onClose}>
      <div className="rounded-2xl bg-[#FBF6F7] p-4 text-center">
        <p className="text-[15px] font-medium text-[#6B5A5F]">Amount</p>
        <p className="mt-1 text-2xl font-extrabold text-[#2A0B14]">{kes(tx.amount)}</p>
        <div className="mt-2">
          <StatusBadge status={tx.status} />
        </div>
      </div>

      <dl className="mt-4 divide-y divide-[#F1E6E8]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-5 py-2">
            <dt className="text-[15px] text-[#6B5A5F]">{label}</dt>
            <dd className="text-right text-[15px] font-semibold text-[#2A0B14]">{value}</dd>
          </div>
        ))}
      </dl>

      {tx.note && <p className="mt-3 rounded-2xl bg-[#FDE7EA] px-3 py-2 text-[15px] text-[#B4152E]">{tx.note}</p>}

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-full border border-[#EBDDE0] px-4 py-2.5 text-[15px] font-semibold text-[#2A0B14] hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
        >
          Print receipt
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full bg-[#D92A42] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#C21F37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42] focus-visible:ring-offset-2"
        >
          Done
        </button>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function MerchantView({ merchantName, userKey }: { merchantName: string; userKey: string }) {
  const router = useRouter();

  // Sessionless: Log out only goes to the login page. The account's saved data is kept.
  const onLogout = () => router.replace(LOGIN_PATH);

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [balance, setBalance] = useState<number>(SHOW_SAMPLE_DATA ? INITIAL_BALANCE : 0);
  const [transactions, setTransactions] = useState<Transaction[]>(SHOW_SAMPLE_DATA ? INITIAL_TRANSACTIONS : []);
  const [requests, setRequests] = useState<PaymentRequest[]>(SHOW_SAMPLE_DATA ? INITIAL_REQUESTS : []);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  // New request form
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [formError, setFormError] = useState("");

  // Which user's saved data is currently on screen (null until it has been loaded).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Returning user: restore their saved balance and history. First-time user: nothing saved, so zero.
  useEffect(() => {
    const saved = loadAccount(userKey);
    if (saved) {
      setBalance(saved.balance);
      setTransactions(saved.transactions);
      setRequests(saved.requests);
    }
    setLoadedFor(userKey);
  }, [userKey]);

  // Save after every change, but only once this user's data has been loaded (never overwrite it with zeros).
  useEffect(() => {
    if (loadedFor !== userKey) return;
    saveAccount(userKey, { balance, transactions, requests });
  }, [loadedFor, userKey, balance, transactions, requests]);

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
    const month = transactions.filter((t) => inMonth(t.settledAt));
    const paid = month.filter((t) => t.status === "success");
    return {
      received: paid.reduce((sum, t) => sum + t.amount, 0),
      paymentsReceived: paid.length,
      awaitingCount: requests.length,
      awaitingTotal: requests.reduce((sum, r) => sum + r.amount, 0),
      notPaid: month.filter((t) => t.status === "failed" || t.status === "rejected" || t.status === "expired").length,
      monthLabel: clockNow().toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
    };
  }, [transactions, requests]);

  const recent = transactions.slice(0, 5);

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.customer.toLowerCase().includes(q) ||
        t.requestNo.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.reference ?? "").toLowerCase().includes(q)
      );
    });
  }, [transactions, statusFilter, query]);

  /* ---- Actions ---- */
  const createRequest = (e: FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s/g, "");
    const value = Number(amount);
    if (!PHONE_PATTERN.test(cleanPhone)) {
      setFormError("Enter a valid Safaricom number for the customer, for example 0712345678.");
      return;
    }
    if (!Number.isInteger(value) || value < 10 || value > 150000) {
      setFormError("Enter a whole amount between KES 10 and KES 150,000.");
      return;
    }
    if (description.trim().length < 3) {
      setFormError("Add a short description so the customer knows what the payment is for.");
      return;
    }
    setFormError("");

    const now = clockNow();
    const request: PaymentRequest = {
      id: `pr_${Date.now()}`,
      requestNo: `REQ-${Math.floor(20940 + Math.random() * 9000)}`,
      customer: `Customer ${maskPhone(cleanPhone)}`,
      description: description.trim(),
      amount: value,
      requestedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + expiryHours * 3600 * 1000).toISOString(),
    };
    setRequests((list) => [request, ...list]);
    setNotice({ kind: "success", text: `Request for ${kes(value)} sent to ${maskPhone(cleanPhone)}.` });
    setPhone("");
    setAmount("");
    setDescription("");
    setExpiryHours(24);
  };

  const cancelRequest = (r: PaymentRequest) => {
    const tx: Transaction = {
      id: `tx_${Date.now()}`,
      requestNo: r.requestNo,
      reference: null,
      customer: r.customer,
      description: r.description,
      amount: r.amount,
      status: "cancelled",
      requestedAt: r.requestedAt,
      settledAt: clockNow().toISOString(),
      note: "You cancelled this request.",
    };
    setRequests((list) => list.filter((x) => x.id !== r.id));
    setTransactions((list) => [tx, ...list]);
    setConfirmCancelId(null);
    setNotice({ kind: "success", text: `Request ${r.requestNo} cancelled.` });
  };

  const inputClass =
    "mt-1.5 w-full rounded-2xl border border-[#EBDDE0] bg-white px-3 py-2.5 text-base focus:border-[#D92A42] focus:outline-none focus:ring-2 focus:ring-[#D92A42]/30";

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
          className={`fixed right-3 top-3 z-[60] max-w-sm rounded-2xl px-4 py-3 text-[15px] font-semibold text-white shadow-lg ${
            notice.kind === "success" ? "bg-[#14733A]" : "bg-[#B4152E]"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="w-full px-2.5 sm:px-4 lg:px-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-2.5 py-4">
          <a href="/merchant" className="text-2xl font-extrabold tracking-tight text-[#2A0B14]">
            Pesa<span className="text-[#D92A42]">Pay</span>
          </a>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold">{merchantName}</span>
              <span className="rounded-full bg-[#FBE9EC] px-2 py-1 text-[15px] font-medium text-[#D92A42]">Merchant</span>
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
        <div
          role="tablist"
          aria-label="Merchant sections"
          className="-mx-2.5 flex gap-1.5 overflow-x-auto border-b border-[#EBDDE0] px-2.5 sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5"
        >
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
                <StatCard label="Received this month" value={kes(stats.received)} hint={`${stats.monthLabel} so far`} />
                <StatCard label="Payments received" value={String(stats.paymentsReceived)} hint="Paid requests" />
                <StatCard
                  label="Awaiting payment"
                  value={String(stats.awaitingCount)}
                  hint={`${kes(stats.awaitingTotal)} outstanding`}
                />
                <StatCard label="Rejected or expired" value={String(stats.notPaid)} hint="Did not get paid" />
              </div>

              <div className="mt-8 rounded-[2.5rem] bg-gradient-to-br from-[#D3213C] via-[#B31C35] to-[#7F1228] p-5 text-white sm:p-8">
                <p className="text-lg font-medium text-white/85">Merchant balance</p>
                <p className="mt-2 break-words text-4xl font-extrabold tracking-tight sm:text-6xl">{kes(balance)}</p>
                {balance === 0 && transactions.length === 0 && requests.length === 0 && (
                  <p className="mt-2 text-base text-white/85">Welcome! Send your first payment request to get started.</p>
                )}
                <button
                  type="button"
                  onClick={() => setTab("requests")}
                  className="mt-5 rounded-full bg-white px-5 py-2.5 text-lg font-semibold text-[#D92A42] hover:bg-[#FBE9EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#B31C35]"
                >
                  New payment request
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
                  <p className="mt-1.5 text-base text-[#6B5A5F]">Payments from your customers will appear here once they pay your requests.</p>
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
                        {tx.customer.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold">{tx.customer}</span>
                        <span className="block truncate text-[15px] text-[#6B5A5F]">
                          {tx.description} - {fmtDateTime(tx.settledAt)}
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

          {/* ---------------------------- Payment requests ---------------------------- */}
          {tab === "requests" && (
            <section role="tabpanel" id="panel-requests" aria-labelledby="tab-requests">
              <h1 className="text-3xl font-extrabold tracking-tight">Payment requests</h1>
              <p className="mt-2 text-base text-[#6B5A5F]">
                Ask a customer to pay. They approve or reject it from their own PesaPay account.
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-5">
                {/* New request form */}
                <form
                  onSubmit={createRequest}
                  noValidate
                  className="h-fit rounded-[2rem] border border-[#EBDDE0] p-4 lg:col-span-2"
                >
                  <h2 className="text-xl font-extrabold tracking-tight">New payment request</h2>

                  <label htmlFor="req-phone" className="mt-4 block text-[15px] font-semibold">
                    Customer phone number
                  </label>
                  <input
                    id="req-phone"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className={inputClass}
                  />

                  <label htmlFor="req-amount" className="mt-3 block text-[15px] font-semibold">
                    Amount (KES)
                  </label>
                  <input
                    id="req-amount"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 1500"
                    className={inputClass}
                  />

                  <label htmlFor="req-desc" className="mt-3 block text-[15px] font-semibold">
                    Description
                  </label>
                  <input
                    id="req-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Invoice #KP-2300"
                    className={inputClass}
                  />

                  <label htmlFor="req-expiry" className="mt-3 block text-[15px] font-semibold">
                    Request expires in
                  </label>
                  <select
                    id="req-expiry"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Number(e.target.value))}
                    className={inputClass}
                  >
                    {EXPIRY_OPTIONS.map((o) => (
                      <option key={o.hours} value={o.hours}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  {formError && (
                    <p role="alert" className="mt-3 text-[15px] font-medium text-[#B4152E]">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="mt-4 w-full rounded-full bg-[#D92A42] px-4 py-2.5 text-lg font-semibold text-white hover:bg-[#C21F37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42] focus-visible:ring-offset-2"
                  >
                    Send request
                  </button>
                </form>

                {/* Awaiting payment */}
                <div className="lg:col-span-3">
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Awaiting payment <span className="text-[#6B5A5F]">({requests.length})</span>
                  </h2>

                  {requests.length === 0 ? (
                    <div className="mt-3 rounded-[2rem] border border-dashed border-[#EBDDE0] px-4 py-10 text-center">
                      <p className="text-lg font-semibold">No requests awaiting payment</p>
                      <p className="mt-1.5 text-base text-[#6B5A5F]">New requests you send will show up here until the customer responds.</p>
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {requests.map((r) => (
                        <li key={r.id} className="rounded-[2rem] border border-[#EBDDE0] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-lg font-extrabold tracking-tight">{r.customer}</p>
                              <p className="mt-0.5 text-[15px] text-[#6B5A5F]">{r.description}</p>
                            </div>
                            <p className="whitespace-nowrap text-xl font-extrabold">{kes(r.amount)}</p>
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-3 text-[15px] sm:grid-cols-3">
                            <div>
                              <dt className="text-[#6B5A5F]">Request no.</dt>
                              <dd className="font-semibold">{r.requestNo}</dd>
                            </div>
                            <div>
                              <dt className="text-[#6B5A5F]">Sent</dt>
                              <dd className="font-semibold">{fmtDateTime(r.requestedAt)}</dd>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <dt className="text-[#6B5A5F]">Expires</dt>
                              <dd className="font-semibold">{fmtDateTime(r.expiresAt)}</dd>
                            </div>
                          </dl>

                          <div className="mt-4 flex flex-wrap items-center gap-2.5">
                            {confirmCancelId === r.id ? (
                              <>
                                <span className="text-[15px] font-medium">Cancel this request?</span>
                                <button
                                  type="button"
                                  onClick={() => setConfirmCancelId(null)}
                                  className="rounded-full border border-[#EBDDE0] px-4 py-2 text-[15px] font-semibold hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
                                >
                                  Keep it
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cancelRequest(r)}
                                  className="rounded-full bg-[#D92A42] px-4 py-2 text-[15px] font-semibold text-white hover:bg-[#C21F37] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42] focus-visible:ring-offset-2"
                                >
                                  Yes, cancel
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmCancelId(r.id)}
                                className="rounded-full border border-[#EBDDE0] px-4 py-2 text-[15px] font-semibold hover:bg-[#FBF6F7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
                              >
                                Cancel request
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* --------------------------- Transaction history --------------------------- */}
          {tab === "history" && (
            <section role="tabpanel" id="panel-history" aria-labelledby="tab-history">
              <h1 className="text-3xl font-extrabold tracking-tight">Transaction history</h1>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <label htmlFor="history-search" className="block text-[15px] font-semibold">
                    Search
                  </label>
                  <input
                    id="history-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Customer, request no., reference or description"
                    className="mt-1.5 w-full rounded-full border border-[#EBDDE0] px-4 py-2.5 text-base focus:border-[#D92A42] focus:outline-none focus:ring-2 focus:ring-[#D92A42]/30"
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
                    className="mt-1.5 rounded-full border border-[#EBDDE0] bg-white px-4 py-2.5 text-base focus:border-[#D92A42] focus:outline-none focus:ring-2 focus:ring-[#D92A42]/30"
                  >
                    <option value="all">All</option>
                    <option value="success">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="mt-5 rounded-[2rem] border border-dashed border-[#EBDDE0] px-4 py-10 text-center">
                  <p className="text-lg font-semibold">{transactions.length === 0 ? "No transactions yet" : "No transactions match"}</p>
                  <p className="mt-1.5 text-base text-[#6B5A5F]">
                    {transactions.length === 0
                      ? "Payments from your customers will appear here once they pay your requests."
                      : "Clear the search or change the status filter to see more."}
                  </p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto rounded-[2rem] border border-[#EBDDE0]">
                  <table className="w-full min-w-[820px] text-left">
                    <thead className="bg-[#FBF6F7] text-[15px] text-[#5E4B51]">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Request no.</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Reference</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Amount</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                        <th scope="col" className="px-4 py-3 font-semibold"><span className="sr-only">Receipt</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1E6E8]">
                      {filteredHistory.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#FBF6F7]">
                          <td className="whitespace-nowrap px-4 py-3 text-[15px] text-[#5E4B51]">{fmtDate(tx.settledAt)}</td>
                          <td className="px-4 py-3">
                            <span className="block text-[15px] font-semibold">{tx.customer}</span>
                            <span className="block text-[13px] text-[#6B5A5F]">{tx.description}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[15px]">{tx.requestNo}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-[15px]">{tx.reference ?? "-"}</td>
                          <td className="px-4 py-3 text-right"><AmountText tx={tx} /></td>
                          <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setReceipt(tx)}
                              className="whitespace-nowrap text-[15px] font-semibold text-[#D92A42] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D92A42]"
                            >
                              {tx.status === "success" ? "View receipt" : "View details"}
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Next.js page: only logged-in merchants see this, with their own name      */
/* -------------------------------------------------------------------------- */

export default function MerchantPage() {
  return (
    <Protected role="merchant">
      {(user) => <MerchantView merchantName={getDisplayName(user)} userKey={getUserKey(user)} />}
    </Protected>
  );
}