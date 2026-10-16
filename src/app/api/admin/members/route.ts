import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { AdminRole, MemberRecord } from "@/types/admin";
import {
  getStoredMembers,
  saveStoredMember,
  canDeactivateMember,
  resetCouncilCredential,
} from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const members = getStoredMembers();

  return NextResponse.json({
    success: true,
    members,
    userRole: auth.session.user.role,
  });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { fullName, email, role, department } = body;

    if (!fullName || !email) {
      return NextResponse.json({ success: false, error: "Full name and email are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = getStoredMembers().find((m) => m.email.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A member with this official email address already exists." },
        { status: 409 }
      );
    }

    const userRole = auth.session.user.role;
    // Privilege Escalation Prevention: Only President can create executive roles (President, Vice President, Admin)
    if ((role === "President" || role === "Vice President" || role === "Admin") && userRole !== "President") {
      return NextResponse.json(
        {
          success: false,
          error: "Privilege Escalation Prevention: Only the President can grant executive roles.",
          code: "CANNOT_ESCALATE_ROLE",
        },
        { status: 403 }
      );
    }

    const assignedRole: AdminRole = role || "AVISHKAR Member";

    const newMember: MemberRecord = {
      id: `mem-${Date.now()}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      role: assignedRole,
      department: department?.trim() || "Organizing Council",
      assignedEventIds: [],
      status: "active",
      joinedAt: new Date().toISOString(),
    };

    saveStoredMember(newMember);

    // Provision credential hash with salt in local council store (never storing plaintext)
    const credResult = resetCouncilCredential(newMember.email);

    await logAdminAction({
      action: "MEMBER_INVITED",
      actor: auth.session.user,
      targetType: "member",
      targetId: newMember.id,
      metadata: { email: newMember.email, role: newMember.role },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      member: newMember,
      tempPassword: credResult.tempPassword,
      message: `Member ${newMember.fullName} added with role ${newMember.role}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating member";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const memberId = body.memberId || body.id;
    const action = body.action;
    const newRole = body.newRole || body.role;
    const status = body.status;
    const assignedEventIds = body.assignedEventIds;
    const newPassword = body.newPassword;

    const members = getStoredMembers();
    const member = members.find((m) => m.id === memberId || m.email.toLowerCase() === memberId?.toLowerCase());
    if (!member) {
      return NextResponse.json({ success: false, error: "Member not found." }, { status: 404 });
    }

    const userRole = auth.session.user.role;

    // 1. Password Reset / Credential Management Workflow
    if (action === "reset-password" || body.resetPassword) {
      // Only President or Admin can reset council credentials
      const credResult = resetCouncilCredential(member.email, newPassword);

      await logAdminAction({
        action: "MEMBER_CREDENTIAL_RESET",
        actor: auth.session.user,
        targetType: "member",
        targetId: member.id,
        metadata: {
          memberEmail: member.email,
          initiatedBy: auth.session.user.email,
        },
        token: auth.session.token,
      });

      return NextResponse.json({
        success: true,
        tempPassword: credResult.tempPassword,
        temporaryToken: credResult.tempPassword,
        message: `Credential reset successfully for ${member.fullName}. Secure temporary password generated.`,
      });
    }

    // 2. Strict security check: Only President can change roles
    if (action === "assign-role" || (newRole && newRole !== member.role)) {
      if (userRole !== "President") {
        return NextResponse.json(
          {
            success: false,
            error: "Security Policy: Only the President can modify or promote member roles.",
            code: "PRESIDENT_REQUIRED_FOR_ROLE_CHANGE",
          },
          { status: 403 }
        );
      }

      const prevRole = member.role;
      if (newRole) {
        member.role = newRole as AdminRole;
      }

      await logAdminAction({
        action: "MEMBER_ROLE_CHANGE",
        actor: auth.session.user,
        targetType: "member",
        targetId: member.id,
        metadata: { previousRole: prevRole, newRole: member.role, email: member.email },
        token: auth.session.token,
      });
    }

    // 3. Account Activation / Deactivation Protection (Anti-Lockout)
    const requestedStatus = status || (action === "deactivate" ? "suspended" : action === "activate" ? "active" : null);
    if (requestedStatus) {
      const normalizedStatus = requestedStatus === "inactive" || requestedStatus === "suspended" ? "suspended" : "active";
      if (normalizedStatus === "suspended") {
        const lockoutCheck = canDeactivateMember(member.id);
        if (!lockoutCheck.allowed) {
          return NextResponse.json(
            {
              success: false,
              error: lockoutCheck.reason || "Cannot deactivate the last active authorized Administrator.",
              code: "LOCKOUT_PREVENTION_BLOCKED",
            },
            { status: 403 }
          );
        }
      }

      if (normalizedStatus !== member.status) {
        const prevStatus = member.status;
        member.status = normalizedStatus;

        await logAdminAction({
          action: "MEMBER_STATUS_CHANGE",
          actor: auth.session.user,
          targetType: "member",
          targetId: member.id,
          metadata: { previousStatus: prevStatus, newStatus: member.status, email: member.email },
          token: auth.session.token,
        });
      }
    }

    if (Array.isArray(assignedEventIds)) {
      member.assignedEventIds = assignedEventIds;
    }

    saveStoredMember(member);

    return NextResponse.json({
      success: true,
      member,
      message: `Member ${member.fullName} updated successfully.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating member";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
