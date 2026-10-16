import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { MemberTaskRecord, TaskStatus } from "@/types/admin";
import { getStoredTasks, saveStoredTask, readDataStore, writeDataStore, saveStoredNotification } from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const memberId = searchParams.get("memberId");

  let tasks = getStoredTasks(memberId || undefined);
  const userRole = auth.session.user.role;
  const userEmail = auth.session.user.email.toLowerCase();
  const userName = (auth.session.user.fullName || "").toLowerCase();

  // Role filtering: AVISHKAR Member can ONLY view their own assigned tasks
  if (userRole === "AVISHKAR Member") {
    tasks = tasks.filter((t) => {
      const matchId = t.memberId === auth.session.user.id;
      const matchName = userName && t.memberName.toLowerCase().includes(userName);
      const matchEmail = (t as unknown as { memberEmail?: string }).memberEmail?.toLowerCase() === userEmail;
      return matchId || matchName || matchEmail;
    });
  }

  if (eventId) {
    tasks = tasks.filter((t) => t.eventId === eventId);
  }

  return NextResponse.json({
    success: true,
    tasks,
    userRole,
  });
}

export async function POST(req: NextRequest) {
  // Members must not assign tasks to other users
  const auth = await authorizeAdminRequest(req, ["Vice President", "President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error,
        code: auth.code,
      },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json();
    const { eventId, eventTitle, memberId, memberName, title, description, priority, dueDate, status, notes } = body;

    if (!eventId || !title || !memberId) {
      return NextResponse.json(
        { success: false, error: "Event ID, task title, and assigned member are required." },
        { status: 400 }
      );
    }

    const newTask: MemberTaskRecord = {
      id: `tsk-${Date.now()}`,
      eventId,
      eventTitle: eventTitle || "Event Task",
      memberId,
      memberName: memberName || "Council Member",
      title: title.trim(),
      description: description?.trim() || "",
      status: (status as TaskStatus) || "todo",
      priority: priority || "medium",
      dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      assignedBy: auth.session.user.fullName || auth.session.user.email,
      assignedByRole: auth.session.user.role,
      notes: notes?.trim() || "",
    };

    saveStoredTask(newTask);

    saveStoredNotification({
      id: `notif-${Date.now()}`,
      title: "New Committee Task Assigned",
      message: `Task '${newTask.title}' assigned for '${newTask.eventTitle}' by ${auth.session.user.fullName || auth.session.user.role}.`,
      type: "task",
      targetRole: "AVISHKAR Member",
      link: "/admin/member",
      read: false,
      createdAt: new Date().toISOString(),
      actorName: auth.session.user.fullName || auth.session.user.role,
    });

    await logAdminAction({
      action: "TASK_CREATED",
      actor: auth.session.user,
      targetType: "task",
      targetId: newTask.id,
      metadata: { eventId, memberId, title: newTask.title, priority: newTask.priority },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      task: newTask,
      message: "Task assigned successfully.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating task";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeAdminRequest(req, ["President", "Vice President", "Admin", "AVISHKAR Member", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { taskId, status, notes, title, description, priority, dueDate, memberId, memberName } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: "taskId is required." }, { status: 400 });
    }

    const tasks = getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const userRole = auth.session.user.role;
    const userName = (auth.session.user.fullName || "").toLowerCase();
    const userEmail = auth.session.user.email.toLowerCase();

    // STRICT OWNERSHIP CHECK FOR MEMBERS: Members can update only tasks assigned to them
    if (userRole === "AVISHKAR Member") {
      const matchId = task.memberId === auth.session.user.id;
      const matchName = userName && task.memberName.toLowerCase().includes(userName);
      const matchEmail = (task as unknown as { memberEmail?: string }).memberEmail?.toLowerCase() === userEmail;
      const isAssigned = matchId || matchName || matchEmail;

      if (!isAssigned) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Members can update only tasks assigned to them.",
            code: "FORBIDDEN",
          },
          { status: 403 }
        );
      }

      // Member can update progress status and personal notes
      if (status) {
        task.status = status as TaskStatus;
      }
      if (notes !== undefined) {
        task.notes = notes;
      }
    } else {
      // VP, President, Admin can update all task fields
      if (status) task.status = status as TaskStatus;
      if (notes !== undefined) task.notes = notes;
      if (title) task.title = title.trim();
      if (description !== undefined) task.description = description.trim();
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
      if (memberId) task.memberId = memberId;
      if (memberName) task.memberName = memberName;
    }

    if (task.status === "completed") {
      task.completedAt = new Date().toISOString();
    }
    task.updatedAt = new Date().toISOString();

    saveStoredTask(task);

    if (userRole === "AVISHKAR Member" && status) {
      saveStoredNotification({
        id: `notif-${Date.now()}`,
        title: status === "blocked" ? "Duty Task Blocked Alert" : "Task Status Updated",
        message: `Member updated task '${task.title}' status to '${status}'.`,
        type: "task",
        targetRole: "Vice President",
        link: "/admin/vice-president",
        read: false,
        createdAt: new Date().toISOString(),
        actorName: auth.session.user.fullName || auth.session.user.role,
      });
    }

    await logAdminAction({
      action: "TASK_STATUS_UPDATED",
      actor: auth.session.user,
      targetType: "task",
      targetId: task.id,
      metadata: { status: task.status, title: task.title },
      token: auth.session.token,
    });

    return NextResponse.json({
      success: true,
      task,
      message: `Task marked as ${task.status.replace("_", " ")}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating task";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Members cannot delete tasks
  const auth = await authorizeAdminRequest(req, ["Vice President", "President", "Admin", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error, code: auth.code }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ success: false, error: "taskId is required." }, { status: 400 });
    }

    const store = readDataStore();
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    store.tasks = store.tasks.filter((t) => t.id !== taskId);
    writeDataStore(store);

    await logAdminAction({
      action: "TASK_DELETED",
      actor: auth.session.user,
      targetType: "task",
      targetId: taskId,
      metadata: { title: task.title },
      token: auth.session.token,
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting task";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
