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
      roleSubtitle="Authorized access for the Executive President. Review and approve event proposals, oversee institutional governance, and inspect audit logs."
      roleBadge="Executive Leadership"
      targetDashboard="/admin/president"
      accentColorClass="text-purple-600 bg-purple-50 border-purple-100"
    />
  );
}
