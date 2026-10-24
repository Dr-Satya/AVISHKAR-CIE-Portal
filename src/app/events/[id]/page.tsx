import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EventDetailClient from "./EventDetailClient";

export default function PublicEventDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-[#0A2047] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <Loader2 className="w-6 h-6 animate-spin text-[#0A2047]" />
            <span>Loading event details...</span>
          </div>
        </div>
      }
    >
      <EventDetailClient />
    </Suspense>
  );
}
