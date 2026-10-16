import React from "react";
import { Container } from "@/components/ui/Container";
import { Info, Sparkles } from "lucide-react";

export function NoticeBanner() {
  return (
    <section className="bg-[#EFF6FF] border-b border-[#D9E4F2] py-2.5 text-xs text-[#153D73]">
      <Container className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>
            <strong>Official Branding Notice:</strong> Official GD Goenka University and AVISHKAR assets are active.
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-[#123B70] shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
          <span>AVISHKAR 2026 Foundation</span>
        </div>
      </Container>
    </section>
  );
}


