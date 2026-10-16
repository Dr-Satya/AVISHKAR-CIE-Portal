import React from "react";
import RoleLoginForm from "@/components/admin/RoleLoginForm";

export const metadata = {
  title: "Administrative Management Login | AVISHKAR 2026",
  description: "Official administrative management portal authentication for AVISHKAR 2026.",
};

export default function AdministrativeManagementLoginPage() {
  return (
    <RoleLoginForm
      expectedRole="Admin"
      roleHeading="Administrative Management"
      roleSubtitle="Sign in to access the administration dashboard."
      roleBadge="Administration"
      targetDashboard="/admin/overview"
      accentColorClass="text-blue-600 bg-blue-50 border-blue-100"
    />
  );
}
