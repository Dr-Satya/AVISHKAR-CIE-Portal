import React from "react";
import RoleLoginForm from "@/components/admin/RoleLoginForm";

export const metadata = {
  title: "President Login | AVISHKAR 2026",
  description: "Executive President authentication for AVISHKAR 2026 Governance.",
};

export default function PresidentLoginPage() {
  return (
    <RoleLoginForm
      expectedRole="President"
      roleHeading="President Login"
      roleBadge="Executive Leadership"
      targetDashboard="/admin/president"
      accentColorClass="text-[#0A2047] bg-[#D4AF37]/20 border-[#D4AF37]/40"
    />
  );
}
