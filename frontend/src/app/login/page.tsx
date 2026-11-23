
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Toast, { type ToastMessage } from "@/components/Toast";

export default function LoginPage() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

  useEffect(() => {
    const message = sessionStorage.getItem("pp_flash");

    if (message) {
      sessionStorage.removeItem("pp_flash");
      setToast({ type: "success", text: message });
    }

    const params = new URLSearchParams(window.location.search);

    if (params.has("error")) {
      setToast({
        type: "error",
        text: "Sign in could not be completed. Please try again.",
      });
    }
  }, []);

  function handleSignIn() {
    setBusy(true);
    window.location.href = "/auth/start";
  }

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <section className="relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-[#7F1224] p-8 text-white sm:p-12 lg:min-h-screen">
        {photoOk && (
          <Image
            src="/client.jpg"
            alt="A happy PesaPay customer"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover object-[center_25%]"
            onError={() => setPhotoOk(false)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-[#7F1224]/40 via-transparent to-[#2B0A10]/90" />

        <div className="relative z-10 text-2xl font-extrabold tracking-tight [font-family:var(--head)]">
          Pesa<span className="text-[#FFD1D6]">Pay</span>
        </div>

        <div className="relative z-10 mt-16 max-w-xl">
          <p className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl [font-family:var(--head)]">
            Payments that <em className="text-[#FFD1D6]">just work.</em>
          </p>

          <p className="mt-4 max-w-[34ch] text-base leading-relaxed text-white/90">
            Top up, pay merchants and get settled, all in one wallet.
          </p>
        </div>
      </section>

      <section className="flex min-h-[500px] items-center justify-center bg-white px-6 py-12 text-[#2B0A10]">
        <div className="flex w-full max-w-[440px] flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight [font-family:var(--head)]">
              Log in
            </h1>

            <p className="mt-2 text-sm text-[#7A5A60]">
              Welcome back. Sign in to continue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={busy}
            className="mt-2 w-full rounded-[10px] bg-[#D7263D] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#B01E31] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Redirecting..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-[#7A5A60]">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#B01E31] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
