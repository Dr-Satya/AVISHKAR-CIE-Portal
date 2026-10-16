import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/adminAuth";
import {
  getStoredNotifications,
  markStoredNotificationRead,
  markAllStoredNotificationsRead,
} from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, [
    "President",
    "Vice President",
    "Admin",
    "AVISHKAR Member",
  ]);

  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  const user = auth.session.user;
  const notifications = getStoredNotifications(user.role, user.email);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({
    success: true,
    notifications,
    unreadCount,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, [
    "President",
    "Vice President",
    "Admin",
    "AVISHKAR Member",
  ]);

  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  try {
    const user = auth.session.user;
    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      markAllStoredNotificationsRead(user.role, user.email);
    } else if (notificationId) {
      markStoredNotificationRead(notificationId);
    }

    const updated = getStoredNotifications(user.role, user.email);
    const unreadCount = updated.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update notification state";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
