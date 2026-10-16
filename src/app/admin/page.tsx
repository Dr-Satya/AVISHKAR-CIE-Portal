"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectUser() {
      try {
        const res = await fetch("/api/admin/auth/me");
        if (!res.ok) {
          router.replace("/admin/management/login");
          return;
        }
        const data = await res.json();
        const role = data.user?.role;
        const target =
          role === "President"
            ? "/admin/president"
            : role === "Vice President"
            ? "/admin/vice-president"
            : role === "AVISHKAR Member"
            ? "/admin/member"
            : "/admin/overview";

        router.replace(target);
      } catch {
        router.replace("/admin/management/login");
      }
    }

    redirectUser();
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
      <p className="text-xs text-slate-500 font-medium">Navigating to your dashboard...</p>
    </div>
  );
}
