"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Protected from "@/components/Protected";
import Toast, { type ToastMessage } from "@/components/Toast";
import { api, session, WALLET_BASE } from "@/lib/api";

const LOGIN_PATH = "/login";
const WALLET_PATH = "/api/v1/wallets/me";
const MAX_TOP_UP_KES = 150000; // the wallet's own limit: 15,000,000 cents

interface Wallet {
  id: string;
  availableCents: number;
  pendingCents: number;
  currency: string;
}

// Money is stored as whole cents; show it as KES with 2 decimals.
const formatKes = (cents: number): string =>
  "KES " +
  (cents / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");


function pick(user: unknown, keys: string[]): string {
  if (user && typeof user === "object") {
    const u = user as Record<string, unknown>;
    for (const key of keys) {
      if (text(u[key])) return text(u[key]);
    }
  }
  return "";
}

function getDisplayName(user: unknown): string {
  const direct = pick(user, ["name", "fullName", "full_name", "displayName", "username"]);
  if (direct) return direct;
  const joined = `${pick(user, ["firstName"])} ${pick(user, ["lastName"])}`.trim();
  if (joined) return joined;
  const email = pick(user, ["email"]);
  return email ? email.split("@")[0] : "Customer";
}


function getDetails(user: unknown, name: string): [string, string][] {
  const rows: [string, string][] = [
    ["Name", name],
    ["Role", "Customer"],
  ];
  const email = pick(user, ["email"]);
  if (email) rows.push(["Email", email]);
  const phone = pick(user, ["phone", "phoneNumber", "phone_number", "mobile"]);
  if (phone) rows.push(["Phone", phone]);
  return rows;
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

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mt-4 rounded-[2rem] border border-dashed border-[#EBDDE0] px-4 py-10 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-1.5 text-base text-[#6B5A5F]">{message}</p>
    </div>
  );
}


function CustomerView({ name, details }: { name: string; details: [string, string][] }) {
  const router = useRouter();


  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  // Load the balance once when the page opens
  useEffect(() => {
    api<Wallet>(WALLET_PATH, { base: WALLET_BASE })
      .then(setWallet)
      .catch((e: Error) => setToast({ type: "error", text: e.message }));
  }, []);

  async function onTopUp() {
    const kes = Number(amount);

    if (!Number.isFinite(kes) || kes < 1 || kes > MAX_TOP_UP_KES) {
      setToast({
        type: "error",
        text: `Enter an amount between KES 1 and KES ${MAX_TOP_UP_KES.toLocaleString("en-KE")}.`,
      });
      return;
    }

    setBusy(true);
    try {
      const updated = await api<Wallet>(`${WALLET_PATH}/top-up`, {
        method: "POST",
        base: WALLET_BASE,
        body: { amountCents: Math.round(kes * 100) },
      });
      setWallet(updated);
      setTopUpOpen(false);
      setAmount("");
      setToast({ type: "success", text: "Top-up successful." });
    } catch (e) {
      setToast({
        type: "error",
        text: e instanceof Error ? e.message : "Something went wrong. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  const onLogout = async () => {
    await session.clear();
    router.replace(LOGIN_PATH);
  };

  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-white font-sans text-[#2A0B14]">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="w-full px-2.5 sm:px-4 lg:px-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#EBDDE0] py-4">
          <a href="/customer" className="text-2xl font-extrabold tracking-tight text-[#2A0B14]">
            Pesa<span className="text-[#D92A42]">Pay</span>
          </a>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold">{name}</span>
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

        <main className="pb-10 pt-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>


        
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Spent this month" value="KES 0.00" hint={`${monthLabel} so far`} />
            <StatCard label="Payments made" value="0" hint="Successful payments" />
            <StatCard label="Most-paid merchant" value="None yet" hint="Pay a merchant to see this" />
            <StatCard label="Failed or rejected" value="0" hint="Did not go through" />
          </div>


          <div className="mt-8 rounded-[2.5rem] bg-gradient-to-br from-[#D3213C] via-[#B31C35] to-[#7F1228] p-5 text-white sm:p-8">
            <p className="text-lg font-medium text-white/85">Wallet balance</p>
            <p className="mt-2 break-words text-4xl font-extrabold tracking-tight sm:text-6xl">
              {wallet ? formatKes(wallet.availableCents) : "..."}
            </p>

            {!topUpOpen ? (
              <button
                type="button"
                onClick={() => setTopUpOpen(true)}
                disabled={!wallet}
                className="mt-5 rounded-full bg-white px-5 py-2.5 text-lg font-semibold text-[#D92A42] hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
              >
                Top up
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void onTopUp();
                }}
                className="mt-5 flex flex-wrap items-center gap-2.5"
              >
                <label htmlFor="topup-amount" className="sr-only">
                  Amount in KES
                </label>
                <input
                  id="topup-amount"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  max={MAX_TOP_UP_KES}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount (KES)"
                  className="w-44 rounded-full bg-white px-4 py-2.5 text-lg text-[#2A0B14] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-white px-5 py-2.5 text-lg font-semibold text-[#D92A42] disabled:opacity-60"
                >
                  {busy ? "Adding..." : "Add money"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTopUpOpen(false);
                    setAmount("");
                  }}
                  className="rounded-full border border-white/60 px-5 py-2.5 text-lg font-semibold text-white"
                >
                  Cancel
                </button>
              </form>
            )}
            <p className="mt-2 text-[15px] text-white/80">Simulated money for testing.</p>
          </div>

          {/* Account details */}
          <h2 className="mt-8 text-2xl font-extrabold tracking-tight">Account details</h2>
          <dl className="mt-4 divide-y divide-[#F1E6E8] rounded-[2rem] border border-[#EBDDE0]">
            {details.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2.5 px-4 py-3">
                <dt className="text-[15px] text-[#6B5A5F]">{label}</dt>
                <dd className="break-all text-[15px] font-semibold">{value}</dd>
              </div>
            ))}
          </dl>


          <h2 className="mt-8 text-2xl font-extrabold tracking-tight">Pending payments</h2>
          <EmptyState
            title="No pending payments"
            message="When a merchant sends you a payment request, it will show up here."
          />


          <h2 className="mt-8 text-2xl font-extrabold tracking-tight">Transaction history</h2>
          <EmptyState title="No transactions yet" message="Your payments and top-ups will appear here." />
        </main>
      </div>
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Protected role="customer">
      {(user) => {
        const name = getDisplayName(user);
        return <CustomerView name={name} details={getDetails(user, name)} />;
      }}
    </Protected>
  );
}