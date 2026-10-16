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
      roleSubtitle="Authorized access for AVISHKAR Council Members. Draft and submit technical event proposals, track review outcomes, and report assigned duty progress."
      roleBadge="Technical Committee"
      targetDashboard="/admin/member"
      accentColorClass="text-teal-600 bg-teal-50 border-teal-100"
    />
  );
}
