

"use client";

import Protected from "@/components/Protected";

export default function Page() {
  return (
    <Protected role="admin">
      {(user) => (
       <div>
         <h1>Admin overview</h1>
             </div>
      )}
    </Protected>
  );
}
