"use client";
import { useRouter } from "next/navigation";
import { session } from "@/lib/api";

// Temporary page body for Step 1. Steps 2+ replace this with the real dashboards.
export default function Welcome({ user, title }) {
  const router = useRouter();
  return (
    <main className="welcome">
      <div className="logo">Pesa<span>Pay</span></div>
      <h1>Hi {user.name.split(" ")[0]} 👋</h1>
      <p>You're logged in as <strong>{user.role}</strong>. This is the <strong>{title}</strong>, which we build in the next steps.</p>
      <button className="btn" onClick={() => { session.clear(); router.replace("/login"); }}>Log out</button>
    </main>
  );
}
