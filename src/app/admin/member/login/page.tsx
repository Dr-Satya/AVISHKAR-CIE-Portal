import React from "react";
import RoleLoginForm from "@/components/admin/RoleLoginForm";

export const metadata = {
  title: "Member Login | AVISHKAR 2026",
  description: "AVISHKAR Member workspace authentication for event proposals and duty tracking.",
};

export default function MemberLoginPage() {
  return (
    <RoleLoginForm
      expectedRole="AVISHKAR Member"
      roleHeading="Member Login"
      roleBadge="Technical Committee"
      targetDashboard="/admin/member"
      accentColorClass="text-[#0A2047] bg-[#0A2047]/10 border-[#0A2047]/20"
    />
  );
}
