"use client"; // this component uses state and click handlers, so it runs in the browser
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, session, homeFor } from "@/lib/api";
import Toast from "./Toast";

const LABELS = { name: "Full name", role: "Role", email: "Email", password: "Password" };

// Checks the form. Returns null if everything is fine, otherwise
// { errors: {field: "message"}, message: "text for the pop-up" }.
function check(mode, f) {
  const required = mode === "register" ? ["name", "role", "email", "password"] : ["email", "password"];
  const missing = required.filter((k) => !f[k].trim());
  if (missing.length) {
    const errors = {};
    missing.forEach((k) => (errors[k] = "This field is required"));
    return { errors, message: `Please fill in all the details: ${missing.map((k) => LABELS[k]).join(", ")}.` };
  }
  if (!/^\S+@\S+\.\S+$/.test(f.email))
    return { errors: { email: "Enter a valid email address" }, message: "That email address doesn't look right." };
  if (mode === "register" && f.password.length < 6)
    return { errors: { password: "Use at least 6 characters" }, message: "Your password must be at least 6 characters." };
  return null;
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
  const [f, setF] = useState({ name: "", role: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [show, setShow] = useState(false); // is the password visible?
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
    if (problem) return notify("error", problem.message); // pop-up, and no API call

    setBusy(true);
    try {
      if (isRegister) {
        await api("/auth/register", { method: "POST", body: { name: f.name.trim(), email: f.email.trim(), password: f.password, role: f.role } });
        sessionStorage.setItem("pp_flash", "Account created! Please sign in with your email and password.");
        router.push("/login");
        return;
      }
      const out = await api("/auth/login", { method: "POST", body: { email: f.email.trim(), password: f.password } });
      const token = out.token || out.access_token;
      if (!token || !out.user) throw new Error("Unexpected login response from the server");
      session.set({ token, user: out.user }); // remember the login
      router.replace(homeFor(out.user.role)); // go to the right dashboard
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
          <>
            <Field label="Full name" error={errors.name}>
              <input autoComplete="name" {...bind("name")} />
            </Field>
            <Field label="Role" error={errors.role}>
              <select {...bind("role")}>
                <option value="">Choose your role</option>
                <option value="customer">Customer</option>
                <option value="merchant">Merchant</option>
              </select>
            </Field>
          </>
        )}
        <Field label="Email" error={errors.email}>
          <input type="email" autoComplete="email" {...bind("email")} />
        </Field>
        <Field label="Password" error={errors.password}>
          <div className="pw">
            <input type={show ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} {...bind("password")} />
            <button type="button" className="toggle" aria-pressed={show} onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
          </div>
        </Field>

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