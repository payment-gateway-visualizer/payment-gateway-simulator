"use client";
import Protected from "@/components/Protected";
import Welcome from "@/components/Welcome";

export default function Page() {
  return <Protected role="merchant">{(user) => <Welcome user={user} title="Merchant dashboard" />}</Protected>;
}
