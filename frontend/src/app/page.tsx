"use client";

import Protected from "@/components/Protected";

export default function Page() {
  return (
    <Protected role="customer">
      {() => null}
    </Protected>
  );
}