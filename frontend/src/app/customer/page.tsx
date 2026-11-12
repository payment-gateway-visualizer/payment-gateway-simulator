"use client";

import { useRouter } from "next/navigation";
import Protected from "@/components/Protected";

// Where Log out sends the user. Change this if your login page lives at another path.
const LOGIN_PATH = "/login";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Reads the first non-empty text field from the logged-in user. */
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

/** The account details shown on the page. Email and phone appear only if the user has them. */
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

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function CustomerView({ name, details }: { name: string; details: [string, string][] }) {
  const router = useRouter();

  // Sessionless: Log out only goes to the login page.
  const onLogout = () => router.replace(LOGIN_PATH);

  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-white font-sans text-[#2A0B14]">
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

          
          {/* Summary */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Spent this month" value="KES 0.00" hint={`${monthLabel} so far`} />
            <StatCard label="Payments made" value="0" hint="Successful payments" />
            <StatCard label="Most-paid merchant" value="None yet" hint="Pay a merchant to see this" />
            <StatCard label="Failed or rejected" value="0" hint="Did not go through" />
          </div>

          {/* Wallet */}
          <div className="mt-8 rounded-[2.5rem] bg-gradient-to-br from-[#D3213C] via-[#B31C35] to-[#7F1228] p-5 text-white sm:p-8">
            <p className="text-lg font-medium text-white/85">Wallet balance</p>
            <p className="mt-2 break-words text-4xl font-extrabold tracking-tight sm:text-6xl">KES 0.00</p>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Top up is not available yet"
              className="mt-5 cursor-not-allowed rounded-full bg-white/60 px-5 py-2.5 text-lg font-semibold text-[#D92A42]/70"
            >
              Top up
            </button>
            <p className="mt-2 text-[15px] text-white/80">Top up is not available yet.</p>
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

          {/* Pending payments */}
          <h2 className="mt-8 text-2xl font-extrabold tracking-tight">Pending payments</h2>
          <EmptyState
            title="No pending payments"
            message="When a merchant sends you a payment request, it will show up here."
          />

          {/* History */}
          <h2 className="mt-8 text-2xl font-extrabold tracking-tight">Transaction history</h2>
          <EmptyState title="No transactions yet" message="Your payments and top-ups will appear here." />
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Next.js page                                                              */
/* -------------------------------------------------------------------------- */

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