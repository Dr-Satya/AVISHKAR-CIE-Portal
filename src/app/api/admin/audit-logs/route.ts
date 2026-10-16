import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import { getStoredAuditLogs } from "@/lib/dataStore";
import { AuditLogRecord } from "@/types/admin";

export async function GET(req: NextRequest) {
  // Authorized administrators: President, Admin
  const auth = await authorizeAdminRequest(req, ["President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase().trim() || "";
  const actor = searchParams.get("actor")?.toLowerCase().trim() || "";
  const action = searchParams.get("action")?.trim() || "";
  const targetType = searchParams.get("targetType")?.toLowerCase().trim() || "";
  const dateFrom = searchParams.get("dateFrom")?.trim() || "";
  const dateTo = searchParams.get("dateTo")?.trim() || "";

  const allLogs = getStoredAuditLogs();

  // Extract filter options from the complete dataset
  const actionSet = new Set<string>();
  const actorSet = new Set<string>();
  const targetTypeSet = new Set<string>();

  for (const log of allLogs) {
    if (log.action) actionSet.add(log.action);
    if (log.actorEmail) actorSet.add(log.actorEmail);
    if (log.targetType) targetTypeSet.add(log.targetType);
  }

  // Filter logs
  const filtered = allLogs.filter((log) => {
    // Action filter
    if (action && log.action !== action) {
      return false;
    }

    // Actor filter (matches email or role)
    if (actor) {
      const matchEmail = log.actorEmail?.toLowerCase().includes(actor);
      const matchRole = log.actorRole?.toLowerCase().includes(actor);
      if (!matchEmail && !matchRole) return false;
    }

    // Target type filter
    if (targetType && log.targetType?.toLowerCase() !== targetType) {
      return false;
    }

    // Date range filter
    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      const logTime = new Date(log.timestamp).getTime();
      if (!isNaN(fromTime) && !isNaN(logTime) && logTime < fromTime) {
        return false;
      }
    }

    if (dateTo) {
      // Include end of the day if date string is YYYY-MM-DD
      const toStr = dateTo.includes("T") ? dateTo : `${dateTo}T23:59:59.999Z`;
      const toTime = new Date(toStr).getTime();
      const logTime = new Date(log.timestamp).getTime();
      if (!isNaN(toTime) && !isNaN(logTime) && logTime > toTime) {
        return false;
      }
    }

    // Search query across fields
    if (search) {
      const metadataStr = log.metadata ? JSON.stringify(log.metadata).toLowerCase() : "";
      const matchesSearch =
        log.action?.toLowerCase().includes(search) ||
        log.actorEmail?.toLowerCase().includes(search) ||
        log.actorRole?.toLowerCase().includes(search) ||
        log.targetType?.toLowerCase().includes(search) ||
        log.targetId?.toLowerCase().includes(search) ||
        metadataStr.includes(search);

      if (!matchesSearch) return false;
    }

    return true;
  });

  // Sanitize: strictly strip any passwords, tokens, hashes, or credentials
  const sanitizedLogs: AuditLogRecord[] = filtered.map((log) => {
    let cleanMeta: Record<string, unknown> | undefined = undefined;
    if (log.metadata) {
      cleanMeta = { ...log.metadata };
      delete cleanMeta.password;
      delete cleanMeta.salt;
      delete cleanMeta.passwordHash;
      delete cleanMeta.token;
      delete cleanMeta.temporaryToken;
      delete cleanMeta.secret;
    }
    return {
      ...log,
      metadata: cleanMeta,
    };
  });

  return NextResponse.json({
    success: true,
    auditLogs: sanitizedLogs,
    totalCount: sanitizedLogs.length,
    filterOptions: {
      actions: Array.from(actionSet).sort(),
      actors: Array.from(actorSet).sort(),
      targetTypes: Array.from(targetTypeSet).sort(),
    },
  });
}

// Append-only constraint: Reject any attempt to edit or delete audit logs
export async function DELETE() {
  return NextResponse.json(
    { success: false, error: "Audit logs are append-only and cannot be deleted or modified." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: "Audit logs are append-only and cannot be modified." },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "Audit logs are append-only and cannot be modified." },
    { status: 405 }
  );
}


