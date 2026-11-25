"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { homeFor } from "@/lib/api";
import type { UserSession } from "@/lib/api";

interface ProtectedProps {
  role: string;
  children: (user: UserSession["user"]) => React.ReactNode;
}

export default function Protected({ role, children }: ProtectedProps) {
  const router = useRouter();

  const [user, setUser] = useState<UserSession["user"] | null>(null);

  useEffect(() => {
    async function load() {
      let response = await fetch("/auth/me");

      // Access token expired: try the refresh token once
      if (response.status === 401) {
        const refreshed = await fetch("/auth/refresh", { method: "POST" });

        if (refreshed.ok) response = await fetch("/auth/me");
      }

      if (!response.ok) {
        router.replace("/login");
        return;
      }

      const me = (await response.json()) as UserSession["user"];

      if (me.role !== role) {
        router.replace(homeFor(me.role));
        return;
      }

      setUser(me);
    }

    load().catch(() => router.replace("/login"));
  }, [role, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#7F1224]">
        <p className="animate-pulse text-lg font-semibold">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return <>{children(user)}</>;
}