
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { session, homeFor } from "@/lib/api";
import type { UserSession } from "@/lib/api";

interface ProtectedProps {
  role: string;
  children: (user: UserSession["user"]) => React.ReactNode;
}

export default function Protected({ role, children }: ProtectedProps) {
  const router = useRouter();

  const [user, setUser] = useState<UserSession["user"] | null>(null);

  useEffect(() => {
    const savedSession = session.get();

    if (!savedSession) {
      router.replace("/login");
      return;
    }

    if (savedSession.user.role !== role) {
      router.replace(homeFor(savedSession.user.role));
      return;
    }

    setUser(savedSession.user);
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
