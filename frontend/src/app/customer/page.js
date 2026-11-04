"use client";
import Protected from "@/components/Protected";
import Welcome from "@/components/Welcome";

export default function Page() {
  return <Protected role="customer">{(user) => <Welcome user={user} title="Customer dashboard" />}</Protected>;
}
