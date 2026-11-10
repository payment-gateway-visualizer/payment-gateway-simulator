
"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as yup from "yup";

import { api } from "@/lib/api";
import Toast, { type ToastMessage } from "@/components/Toast";

interface RegisterValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  confirm: string;
}

const registerSchema: yup.ObjectSchema<RegisterValues> = yup.object({
  firstName: yup.string().trim().required("First name is required"),

  lastName: yup.string().trim().required("Last name is required"),

  email: yup
    .string()
    .trim()
    .email("Enter a valid email address")
    .required("Email is required"),

  phone: yup
    .string()
    .required("Phone number is required")
    .test(
      "valid-phone",
      "Enter a valid number, e.g. +254 712 345 678",
      (value) =>
        !!value &&
        /^\+?\d{9,15}$/.test(value.replace(/[\s-]/g, ""))
    ),

  role: yup
    .string()
    .oneOf(["CUSTOMER", "MERCHANT"], "Choose a valid role")
    .required("Please choose your role"),

  password: yup
    .string()
    .min(8, "Password must have at least 8 characters")
    .matches(/[A-Za-z]/, "Password must contain a letter")
    .matches(/\d/, "Password must contain a number")
    .required("Password is required"),

  confirm: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords don't match")
    .required("Please confirm your password"),
});

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterValues>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterValues, string>>
  >({});

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  function updateField(field: keyof RegisterValues, value: string) {
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

    try {
      await registerSchema.validate(form, { abortEarly: false });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const fieldErrors: Partial<
          Record<keyof RegisterValues, string>
        > = {};

        error.inner.forEach((item) => {
          if (
            item.path &&
            item.path in form &&
            !fieldErrors[item.path as keyof RegisterValues]
          ) {
            fieldErrors[item.path as keyof RegisterValues] = item.message;
          }
        });

        setErrors(fieldErrors);
        setToast({
          type: "error",
          text: "Please check the details you entered.",
        });
      }

      return;
    }

    setBusy(true);

    try {
      await api("/api/v1/auth/register", {
        method: "POST",
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          role: form.role,
          password: form.password,
        },
      });

      sessionStorage.setItem(
        "pp_flash",
        "Account created! Please sign in with your email and password."
      );

      router.push("/login");
    } catch (error) {
      setToast({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.",
      });

      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-[10px] border-2 border-[#CFA0A8] px-3 py-3 font-normal text-[#2B0A10] outline-none transition placeholder:text-[#A58A8F] focus:border-[#D7263D]";

  const errorClass = "text-xs font-normal text-[#B3001B]";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#7F1224] px-4 py-10 sm:px-6">
      <Image
        src="/signup.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div className="absolute inset-0 bg-[#2B0A10]/65" />

      <Toast toast={toast} onClose={() => setToast(null)} />

      <section className="relative z-10 w-full max-w-[640px] rounded-3xl bg-white px-6 py-8 text-[#2B0A10] shadow-2xl sm:px-10 sm:py-10">
        <div className="mb-7 text-center">
          <div className="text-2xl font-extrabold tracking-tight [font-family:var(--head)]">
            Pesa<span className="text-[#D7263D]">Pay</span>
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight [font-family:var(--head)]">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-[#7A5A60]">
            Sign up to start using your wallet.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              First name
              <input
                type="text"
                autoComplete="given-name"
                placeholder="Jane"
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                aria-invalid={!!errors.firstName}
                className={inputClass}
              />
              {errors.firstName && (
                <span className={errorClass}>{errors.firstName}</span>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Last name
              <input
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                aria-invalid={!!errors.lastName}
                className={inputClass}
              />
              {errors.lastName && (
                <span className={errorClass}>{errors.lastName}</span>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Email
            <input
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(event) =>
                updateField("email", event.target.value)
              }
              aria-invalid={!!errors.email}
              className={inputClass}
            />
            {errors.email && (
              <span className={errorClass}>{errors.email}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Phone number
            <input
              type="tel"
              autoComplete="tel"
              placeholder="+254 712 345 678"
              value={form.phone}
              onChange={(event) =>
                updateField("phone", event.target.value)
              }
              aria-invalid={!!errors.phone}
              className={inputClass}
            />
            {errors.phone && (
              <span className={errorClass}>{errors.phone}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Role
            <select
              value={form.role}
              onChange={(event) =>
                updateField("role", event.target.value)
              }
              aria-invalid={!!errors.role}
              className={inputClass}
            >
              <option value="">Choose your role</option>
              <option value="CUSTOMER">Customer</option>
              <option value="MERCHANT">Merchant</option>
            </select>
            {errors.role && (
              <span className={errorClass}>{errors.role}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Password
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                aria-invalid={!!errors.password}
                className={`${inputClass} pr-16`}
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
              <span className={errorClass}>{errors.password}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Confirm password
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={form.confirm}
              onChange={(event) =>
                updateField("confirm", event.target.value)
              }
              aria-invalid={!!errors.confirm}
              className={inputClass}
            />
            {errors.confirm && (
              <span className={errorClass}>{errors.confirm}</span>
            )}
          </label>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-[10px] bg-[#D7263D] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#B01E31] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Please wait..." : "Create account"}
          </button>

          <p className="text-center text-sm text-[#7A5A60]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#B01E31] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}