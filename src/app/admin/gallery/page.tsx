"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminGalleryAliasPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/photos");
  }, [router]);

  return (
    <div className="p-8 text-center text-slate-500 text-sm">
      Redirecting to Event Photos Management...
    </div>
  );
}
