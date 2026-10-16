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
      roleSubtitle="Authorized access for the Vice President of Operations. Coordinate approved competition tracks, delegate committee duties, and resolve operational blockers."
      roleBadge="Operations Co-Lead"
      targetDashboard="/admin/vice-president"
      accentColorClass="text-indigo-600 bg-indigo-50 border-indigo-100"
    />
  );
}
