"use client";

import { useRouter } from "next/navigation";
import Protected from "@/components/Protected";


const LOGIN_PATH = "/login";



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
  const direct = pick(user, ["businessName", "name", "fullName", "full_name", "displayName", "username"]);
  if (direct) return direct;
  const joined = `${pick(user, ["firstName"])} ${pick(user, ["lastName"])}`.trim();
  if (joined) return joined;
  const email = pick(user, ["email"]);
  return email ? email.split("@")[0] : "Merchant";
}

/** The account details*/
function getDetails(user: unknown, name: string): [string, string][] {
  const rows: [string, string][] = [
    ["Business name", name],
    ["Role", "Merchant"],
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



function MerchantView({ name, details }: { name: string; details: [string, string][] }) {
  const router = useRouter();

 
  const onLogout = () => router.replace(LOGIN_PATH);

  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-white font-sans text-[#2A0B14]">
      <div className="w-full px-2.5 sm:px-4 lg:px-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#EBDDE0] py-4">
          <a href="/merchant" className="text-2xl font-extrabold tracking-tight text-[#2A0B14]">
            Pesa<span className="text-[#D92A42]">Pay</span>
          </a>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold">{name}</span>
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

        <main className="pb-10 pt-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>

          
        
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Received this month" value="KES 0.00" hint={`${monthLabel} so far`} />
            <StatCard label="Payments received" value="0" hint="Paid requests" />
            <StatCard label="Awaiting payment" value="0" hint="KES 0.00 outstanding" />
            <StatCard label="Rejected or expired" value="0" hint="Did not get paid" />
          </div>

        
          <div className="mt-8 rounded-[2.5rem] bg-gradient-to-br from-[#D3213C] via-[#B31C35] to-[#7F1228] p-5 text-white sm:p-8">
            <p className="text-lg font-medium text-white/85">Merchant balance</p>
            <p className="mt-2 break-words text-4xl font-extrabold tracking-tight sm:text-6xl">KES 0.00</p>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Payment requests are not available yet"
              className="mt-5 cursor-not-allowed rounded-full bg-white/60 px-5 py-2.5 text-lg font-semibold text-[#D92A42]/70"
            >
              New payment request
            </button>
            <p className="mt-2 text-[15px] text-white/80">Payment requests are not available yet.</p>
          </div>

        
          <h2 className="mt-8 text-2xl font-extrabold tracking-tight">Account details</h2>
          <dl className="mt-4 divide-y divide-[#F1E6E8] rounded-[2rem] border border-[#EBDDE0]">
            {details.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2.5 px-4 py-3">
                <dt className="text-[15px] text-[#6B5A5F]">{label}</dt>
                <dd className="break-all text-[15px] font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          
          <h2 className="mt-8 text-2xl font-extrabold tracking-tight">Awaiting payment</h2>
          <EmptyState
            title="No requests awaiting payment"
            message="Requests you send will show up here until the customer responds."
          />

        
          <h2 className="mt-8 text-2xl font-extrabold tracking-tight">Transaction history</h2>
          <EmptyState
            title="No transactions yet"
            message="Payments from your customers will appear here once they pay your requests."
          />
        </main>
      </div>
    </div>
  );
}



export default function MerchantPage() {
  return (
    <Protected role="merchant">
      {(user) => {
        const name = getDisplayName(user);
        return <MerchantView name={name} details={getDetails(user, name)} />;
      }}
    </Protected>
  );
}