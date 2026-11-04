"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { session, homeFor } from "@/lib/api";

// Wrap any page in <Protected role="customer"> to guard it.
// Not logged in -> /login. Wrong role -> that user's own dashboard.
export default function Protected({ role, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const s = session.get();
    if (!s) return router.replace("/login");
    if (s.user.role !== role) return router.replace(homeFor(s.user.role));
    setUser(s.user);
  }, [role, router]);

  if (!user) return <div className="boot">Loading…</div>;
  return children(user);
}
