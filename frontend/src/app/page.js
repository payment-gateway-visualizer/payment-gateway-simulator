"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { session, homeFor } from "@/lib/api";

// "/" just sends you to the right place.
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const s = session.get();
    router.replace(s ? homeFor(s.user.role) : "/login");
  }, [router]);
  return <div className="boot">Loading…</div>;
}
