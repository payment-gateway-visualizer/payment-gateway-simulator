

"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as yup from "yup";

import { api, session, homeFor } from "@/lib/api";
import Toast, { type ToastMessage } from "@/components/Toast";

// The login form only needs email and password.
interface LoginValues {
  email: string;
  password: string;
}


interface LoginResponse {
  token: string;
  role: string;
  firstName?: string;
  expiresInSeconds?: number;
}

// Yup validation rules.
const loginSchema: yup.ObjectSchema<LoginValues> = yup.object({
  email: yup
    .string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),

  password: yup
    .string()
    .required("Password is required"),
});

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState<LoginValues>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof LoginValues, string>>
  >({});

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

 
  useEffect(() => {
    const message = sessionStorage.getItem("pp_flash");

    if (message) {
      sessionStorage.removeItem("pp_flash");
      setToast({ type: "success", text: message });
    }
  }, []);

  function updateField(field: keyof LoginValues, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrors({});

    // Validate the form using Yup.
    try {
      await loginSchema.validate(form, { abortEarly: false });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const fieldErrors: Partial<
          Record<keyof LoginValues, string>
        > = {};

        error.inner.forEach((item) => {
          if (
            item.path &&
            item.path in form &&
            !fieldErrors[item.path as keyof LoginValues]
          ) {
            fieldErrors[item.path as keyof LoginValues] = item.message;
          }
        });

        setErrors(fieldErrors);
        setToast({
          type: "error",
          text: "Please check your email and password.",
        });
      }

      return;
    }

    setBusy(true);

    try {
      // Send login details to the Spring Boot backend.
      const response = await api<LoginResponse>(
        "/api/v1/auth/login",
        {
          method: "POST",
          body: {
            email: form.email.trim(),
            password: form.password,
          },
        }
      );

      if (!response.token || !response.role) {
        throw new Error("Unexpected login response from the server.");
      }

      const role = response.role.toLowerCase();

      
      session.set({
        token: response.token,
        user: {
          role,
          name: response.firstName,
        },
        expiresAt:
          Date.now() + (response.expiresInSeconds || 3600) * 1000,
      });

      // Navigate to the appropriate dashboard.
      router.replace(homeFor(role));
    } catch (error) {
      setToast({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });

      setBusy(false);
    }
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
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex w-full max-w-[440px] flex-col gap-5"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight [font-family:var(--head)]">
              Log in
            </h1>

            <p className="mt-2 text-sm text-[#7A5A60]">
              Welcome back. Enter your details.
            </p>
          </div>

        
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Email

            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                updateField("email", event.target.value)
              }
              aria-invalid={!!errors.email}
              placeholder="Enter your email"
              className={`w-full rounded-[10px] border-2 px-3 py-3 font-normal outline-none transition focus:border-[#D7263D] ${
                errors.email
                  ? "border-[#B3001B]"
                  : "border-[#CFA0A8]"
              }`}
            />

            {errors.email && (
              <span className="text-xs font-normal text-[#B3001B]">
                {errors.email}
              </span>
            )}
          </label>

          
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Password

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                aria-invalid={!!errors.password}
                placeholder="Enter your password"
                className={`w-full rounded-[10px] border-2 px-3 py-3 pr-16 font-normal outline-none transition focus:border-[#D7263D] ${
                  errors.password
                    ? "border-[#B3001B]"
                    : "border-[#CFA0A8]"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#B01E31]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {errors.password && (
              <span className="text-xs font-normal text-[#B3001B]">
                {errors.password}
              </span>
            )}
          </label>

          
          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-[10px] bg-[#D7263D] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#B01E31] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Please wait..." : "Sign in"}
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
        </form>
      </section>
    </main>
  );
}
