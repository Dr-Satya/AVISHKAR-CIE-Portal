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
      roleBadge="Administration"
      targetDashboard="/admin/overview"
      accentColorClass="text-[#0A2047] bg-[#0A2047]/10 border-[#0A2047]/20"
    />
  );
}
