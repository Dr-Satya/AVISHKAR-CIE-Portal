import React from "react";
import RoleLoginForm from "@/components/admin/RoleLoginForm";

export const metadata = {
  title: "Vice President Login | AVISHKAR 2026",
  description: "Vice President operations portal authentication for AVISHKAR 2026.",
};

export default function VicePresidentLoginPage() {
  return (
    <RoleLoginForm
      expectedRole="Vice President"
      roleHeading="Vice President Login"
      roleBadge="Operations Co-Lead"
      targetDashboard="/admin/vice-president"
      accentColorClass="text-[#0A2047] bg-[#0A2047]/10 border-[#0A2047]/20"
    />
  );
}
