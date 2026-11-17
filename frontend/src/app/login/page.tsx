"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as yup from "yup";

import { api, session, homeFor, setToken } from "@/lib/api";
import Toast, { type ToastMessage } from "@/components/Toast";

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

const initialValues: LoginValues = {
  email: "",
  password: "",
};

// Login only checks that the fields are filled in. The password strength
// rules belong on the register page, not here.
const loginSchema: yup.ObjectSchema<LoginValues> = yup.object({
  email: yup
    .string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),

  password: yup.string().required("Password is required"),
});

export default function LoginPage() {
  const router = useRouter();

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

  useEffect(() => {
    const message = sessionStorage.getItem("pp_flash");

    if (message) {
      sessionStorage.removeItem("pp_flash");
      setToast({ type: "success", text: message });
    }
  }, []);

  const formik = useFormik<LoginValues>({
    initialValues,
    validationSchema: loginSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        const response = await api<LoginResponse>("/api/v1/auth/login", {
          method: "POST",
          auth: false,
          body: {
            email: values.email.trim(),
            password: values.password,
          },
        });

        if (!response.role || !response.token) {
          throw new Error("Unexpected login response from the server.");
        }

        const role = response.role.toLowerCase();

        setToken(response.token);

        session.set({
          user: {
            role,
            name: response.firstName,
          },
          expiresAt:
            Date.now() + (response.expiresInSeconds || 3600) * 1000,
        });

        router.replace(homeFor(role));
      } catch (error) {
        setToast({
          type: "error",
          text:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        });
      }
    },
  });

  // Show an error only after the field has been touched (blurred or submitted)
  function fieldError(field: keyof LoginValues): string | undefined {
    return formik.touched[field] ? formik.errors[field] : undefined;
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
          onSubmit={formik.handleSubmit}
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
              name="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={!!fieldError("email")}
              placeholder="Enter your email"
              className={`w-full rounded-[10px] border-2 px-3 py-3 font-normal outline-none transition focus:border-[#D7263D] ${
                fieldError("email") ? "border-[#B3001B]" : "border-[#CFA0A8]"
              }`}
            />

            {fieldError("email") && (
              <span className="text-xs font-normal text-[#B3001B]">
                {fieldError("email")}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Password

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={!!fieldError("password")}
                placeholder="Enter your password"
                className={`w-full rounded-[10px] border-2 px-3 py-3 pr-16 font-normal outline-none transition focus:border-[#D7263D] ${
                  fieldError("password")
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

            {fieldError("password") && (
              <span className="text-xs font-normal text-[#B3001B]">
                {fieldError("password")}
              </span>
            )}
          </label>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="mt-2 w-full rounded-[10px] bg-[#D7263D] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#B01E31] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formik.isSubmitting ? "Please wait..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-[#7A5A60]">
            Don&apos;t have an account?{" "}
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
