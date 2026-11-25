"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
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

const initialValues: RegisterValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  password: "",
  confirm: "",
};

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
        !!value && /^\+?\d{9,15}$/.test(value.replace(/[\s-]/g, ""))
    ),

  role: yup
    .string()
    .required("Please choose your role")
    .oneOf(["CUSTOMER", "MERCHANT"], "Choose a valid role"),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must have at least 8 characters")
    .matches(/[a-z]/, "Password must contain a lowercase letter")
    .matches(/[A-Z]/, "Password must contain an uppercase letter")
    .matches(/\d/, "Password must contain a number")
    .matches(/[^A-Za-z0-9]/, "Password must contain a special character"),

  confirm: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords don't match"),
});

export default function RegisterPage() {
  const router = useRouter();

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik<RegisterValues>({
    initialValues,
    validationSchema: registerSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      try {
        await api("/api/v1/auth/register", {
          method: "POST",
          body: {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            role: values.role,
            password: values.password,
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
      }
    },
  });

 
  function fieldError(field: keyof RegisterValues): string | undefined {
    return formik.touched[field] ? formik.errors[field] : undefined;
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

        <form
          onSubmit={formik.handleSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              First name
              <input
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder="Jane"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={!!fieldError("firstName")}
                className={inputClass}
              />
              {fieldError("firstName") && (
                <span className={errorClass}>{fieldError("firstName")}</span>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              Last name
              <input
                type="text"
                name="lastName"
                autoComplete="family-name"
                placeholder="Doe"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={!!fieldError("lastName")}
                className={inputClass}
              />
              {fieldError("lastName") && (
                <span className={errorClass}>{fieldError("lastName")}</span>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={!!fieldError("email")}
              className={inputClass}
            />
            {fieldError("email") && (
              <span className={errorClass}>{fieldError("email")}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Phone number
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="+254 712 345 678"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={!!fieldError("phone")}
              className={inputClass}
            />
            {fieldError("phone") && (
              <span className={errorClass}>{fieldError("phone")}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Role
            <select
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={!!fieldError("role")}
              className={inputClass}
            >
              <option value="">Choose your role</option>
              <option value="CUSTOMER">Customer</option>
              <option value="MERCHANT">Merchant</option>
            </select>
            {fieldError("role") && (
              <span className={errorClass}>{fieldError("role")}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Password
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={!!fieldError("password")}
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
            {fieldError("password") && (
              <span className={errorClass}>{fieldError("password")}</span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            Confirm password
            <input
              type={showPassword ? "text" : "password"}
              name="confirm"
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={formik.values.confirm}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={!!fieldError("confirm")}
              className={inputClass}
            />
            {fieldError("confirm") && (
              <span className={errorClass}>{fieldError("confirm")}</span>
            )}
          </label>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="mt-2 w-full rounded-[10px] bg-[#D7263D] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#B01E31] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formik.isSubmitting ? "Please wait..." : "Create account"}
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