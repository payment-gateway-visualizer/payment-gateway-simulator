

"use client";

import Protected from "@/components/Protected";
import Welcome from "@/components/Welcome";

export default function Page() {
  return (
    <Protected role="admin">
      {(user) => (
        <Welcome user={user} title="Admin overview" />
      )}
    </Protected>
  );
}
