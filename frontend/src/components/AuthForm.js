"use client"; // this component uses state and click handlers, so it runs in the browser
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, session, homeFor } from "@/lib/api";
import Toast from "./Toast";

const LABELS = {
  firstName: "First name", lastName: "Last name", email: "Email", phone: "Phone number",
  role: "Role", password: "Password", confirm: "Confirm password",
};

// Checks the form. Returns null if everything is fine, otherwise
// { errors: {field: "message"}, message: "text for the pop-up" }.
function check(mode, f) {
  const reg = mode === "register";
  const required = reg ? ["firstName", "lastName", "email", "phone", "role", "password", "confirm"] : ["email", "password"];
  const missing = required.filter((k) => !f[k].trim());
  if (missing.length) {
    const errors = {};
    missing.forEach((k) => (errors[k] = "This field is required"));
    return { errors, message: `Please fill in all the details: ${missing.map((k) => LABELS[k]).join(", ")}.` };
  }

  const errors = {};
  let message = "";
  const bad = (k, short, long) => { errors[k] = short; message = message || long; };

  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) bad("email", "Enter a valid email address", "That email address doesn't look right.");
  if (reg) {
    // spaces and dashes are fine, the backend cleans the number
    if (!/^\+?\d{9,15}$/.test(f.phone.replace(/[\s-]/g, ""))) bad("phone", "Enter a valid number, e.g. +254 712 345 678", "That phone number doesn't look right.");
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))
      bad("password", "At least 8 characters, with a letter and a number", "Your password needs at least 8 characters, with a letter and a number.");
    else if (f.confirm !== f.password) bad("confirm", "Passwords don't match", "The two passwords don't match.");
  }
  return Object.keys(errors).length ? { errors, message } : null;
}

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="field-err">{error}</small>}
    </label>
  );
}

export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [show, setShow] = useState(false); // are the passwords visible?
  const [busy, setBusy] = useState(false);
  const [photoOk, setPhotoOk] = useState(true); // hides the picture if the file is missing
  const close = useCallback(() => setToast(null), []);
  const notify = (type, text) => setToast({ type, text, id: Date.now() });

  // After signing up we send you to Sign in, and show this success message there.
  useEffect(() => {
    const msg = sessionStorage.getItem("pp_flash");
    if (msg && !isRegister) {
      sessionStorage.removeItem("pp_flash");
      setToast({ type: "success", text: msg, id: Date.now() });
    }
  }, [isRegister]);

  const bind = (k) => ({
    value: f[k],
    onChange: (e) => setF({ ...f, [k]: e.target.value }),
    "aria-invalid": !!errors[k],
  });

  async function submit(e) {
    e.preventDefault(); // stop the browser's default page reload
    const problem = check(mode, f);
    setErrors(problem ? problem.errors : {});
    if (problem) return notify("error", problem.message); // pop-up, and nothing is sent

    setBusy(true);
    try {
      if (isRegister) {
        // "confirm" is only checked here in the browser, it is NOT sent
        await api("/api/v1/auth/register", {
          method: "POST",
          body: { firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: f.phone.trim(), role: f.role, password: f.password },
        });
        sessionStorage.setItem("pp_flash", "Account created! Please sign in with your email and password.");
        router.push("/login");
        return;
      }
      const out = await api("/api/v1/auth/login", { method: "POST", body: { email: f.email.trim(), password: f.password } });
      if (!out.token || !out.role) throw new Error("Unexpected login response from the server");
      const role = out.role.toLowerCase(); // CUSTOMER -> customer
      session.set({
        token: out.token,
        user: { role, name: out.firstName },
        expiresAt: Date.now() + (out.expiresInSeconds || 3600) * 1000, // signs you out when the token expires
      });
      router.replace(homeFor(role)); // go to the right dashboard
    } catch (err) {
      notify("error", err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <Toast toast={toast} onClose={close} />
      <section className="hero">
        <div className="logo">Pesa<span>Pay</span></div>
        {photoOk && (
          <Image className="client-photo" src="/client.jpg" alt="A happy PesaPay customer" width={420} height={525} priority onError={() => setPhotoOk(false)} />
        )}
        <p>Pay. Get paid. <em>Settle.</em></p>
      </section>

      <form onSubmit={submit} noValidate>
        <h1>{isRegister ? "Create your account" : "Sign in"}</h1>
        <p className="sub">{isRegister ? "Sign up to start using your wallet." : "Welcome back. Enter your details."}</p>

        {isRegister && (
          <div className="row2">
            <Field label="First name" error={errors.firstName}>
              <input autoComplete="given-name" placeholder="Jane" {...bind("firstName")} />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input autoComplete="family-name" placeholder="Doe" {...bind("lastName")} />
            </Field>
          </div>
        )}
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" {...bind("email")} />
        </Field>
        {isRegister && (
          <>
            <Field label="Phone number" error={errors.phone}>
              <input type="tel" autoComplete="tel" placeholder="+254 712 345 678" {...bind("phone")} />
            </Field>
            <Field label="Role" error={errors.role}>
              <select {...bind("role")}>
                <option value="">Choose your role</option>
                <option value="CUSTOMER">Customer</option>
                <option value="MERCHANT">Merchant</option>
              </select>
            </Field>
          </>
        )}
        <Field label="Password" error={errors.password}>
          <div className="pw">
            <input type={show ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} {...bind("password")} />
            <button type="button" className="toggle" aria-pressed={show} onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
          </div>
        </Field>
        {isRegister && (
          <Field label="Confirm password" error={errors.confirm}>
            <input type={show ? "text" : "password"} autoComplete="new-password" {...bind("confirm")} />
          </Field>
        )}

        <button className="btn" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Sign up" : "Sign in"}</button>

        <p className="swap">
          {isRegister
            ? <>Already have an account? <Link href="/login">Sign in</Link></>
            : <>Don't have an account? <Link href="/register">Sign up</Link></>}
        </p>
      </form>
    </div>
  );
}