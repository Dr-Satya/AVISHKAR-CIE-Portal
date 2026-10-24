import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRequest, logAdminAction } from "@/lib/adminAuth";
import { MemberTaskRecord, TaskPriority, TaskStatus, TaskSubtask } from "@/types/admin";
import {
  getStoredTasks,
  saveStoredTask,
  readDataStore,
  writeDataStore,
  saveStoredNotification,
  hasCircularDependency,
} from "@/lib/dataStore";

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
    const {
      eventId,
      eventTitle,
      memberId,
      memberName,
      memberEmail,
      title,
      description,
      priority = "medium",
      dueDate,
      dueTime,
      status = "todo",
      notes,
      subtasks,
      completionCriteria,
      dependsOnTaskIds = [],
    } = body;

    if (!eventId || !title || !memberId) {
      return NextResponse.json(
        { success: false, error: "Event ID, task title, and assigned member are required." },
        { status: 400 }
      );
    }

    const allTasks = getStoredTasks();
    const newTaskId = `tsk-${Date.now()}`;

    // Validate dependencies for circular references
    if (Array.isArray(dependsOnTaskIds) && dependsOnTaskIds.length > 0) {
      if (hasCircularDependency(newTaskId, dependsOnTaskIds, allTasks)) {
        return NextResponse.json(
          {
            success: false,
            error: "Circular dependency detected: Task cannot depend on a task that directly or indirectly depends on it.",
          },
          { status: 400 }
        );
      }
    }

    const actor = auth.session.user;
    const nowIso = new Date().toISOString();

    const formattedSubtasks: TaskSubtask[] = Array.isArray(subtasks)
      ? subtasks.map((st: any, idx: number) => ({
          id: st.id || `st-${Date.now()}-${idx}`,
          title: typeof st === "string" ? st : st.title || `Subtask ${idx + 1}`,
          completed: Boolean(st.completed),
          completedAt: st.completed ? nowIso : undefined,
        }))
      : [];

    const newTask: MemberTaskRecord = {
      id: newTaskId,
      eventId,
      eventTitle: eventTitle || "Event Task",
      memberId,
      memberName: memberName || "Council Member",
      memberEmail: memberEmail || undefined,
      title: title.trim(),
      description: description?.trim() || "",
      status: (status as TaskStatus) || "todo",
      priority: (priority as TaskPriority) || "medium",
      dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
      dueTime: dueTime || "17:00",
      createdAt: nowIso,
      assignedBy: actor.fullName || actor.email,
      assignedByRole: actor.role,
      notes: notes?.trim() || "",
      subtasks: formattedSubtasks,
      completionCriteria: completionCriteria?.trim() || undefined,
      dependsOnTaskIds: Array.isArray(dependsOnTaskIds) ? dependsOnTaskIds : [],
      history: [
        {
          timestamp: nowIso,
          actorName: actor.fullName || actor.email,
          actorRole: actor.role,
          action: "TASK_CREATED",
          details: `Assigned to ${memberName || "Council Member"} with ${priority.toUpperCase()} priority.`,
        },
      ],
    };

    saveStoredTask(newTask);

    saveStoredNotification({
      id: `notif-${Date.now()}`,
      title: "New Committee Task Assigned",
      message: `Task '${newTask.title}' assigned for '${newTask.eventTitle}' by ${actor.fullName || actor.role}. Due: ${newTask.dueDate}.`,
      type: "task",
      targetRole: "AVISHKAR Member",
      link: "/admin/member",
      read: false,
      createdAt: nowIso,
      actorName: actor.fullName || actor.role,
    });

    await logAdminAction({
      action: "TASK_CREATED",
      actor,
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
    const {
      taskId,
      status,
      notes,
      title,
      description,
      priority,
      dueDate,
      dueTime,
      memberId,
      memberName,
      memberEmail,
      reassignmentReason,
      subtasks,
      completionCriteria,
      dependsOnTaskIds,
      completionNotes,
      completionEvidenceUrl,
    } = body;

    if (!taskId) {
      return NextResponse.json({ success: false, error: "taskId is required." }, { status: 400 });
    }

    const tasks = getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    const actor = auth.session.user;
    const userRole = actor.role;
    const userName = (actor.fullName || "").toLowerCase();
    const userEmail = actor.email.toLowerCase();
    const nowIso = new Date().toISOString();

    if (!task.history) task.history = [];
    if (!task.reassignmentHistory) task.reassignmentHistory = [];

    // STRICT OWNERSHIP CHECK FOR MEMBERS: Members can update only tasks assigned to them
    if (userRole === "AVISHKAR Member") {
      const matchId = task.memberId === actor.id;
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

      // Member can update progress status, personal notes, subtasks, and completion notes
      if (status) {
        // If attempting to mark completed, check dependencies
        if (status === "completed" && Array.isArray(task.dependsOnTaskIds) && task.dependsOnTaskIds.length > 0) {
          const incompletePrereq = tasks.find(
            (t) => task.dependsOnTaskIds?.includes(t.id) && t.status !== "completed"
          );
          if (incompletePrereq) {
            return NextResponse.json(
              {
                success: false,
                error: `Cannot complete task: Prerequisite task '${incompletePrereq.title}' must be completed first.`,
              },
              { status: 400 }
            );
          }
        }
        task.status = status as TaskStatus;
      }
      if (notes !== undefined) task.notes = notes;
      if (completionNotes !== undefined) task.completionNotes = completionNotes;
      if (completionEvidenceUrl !== undefined) task.completionEvidenceUrl = completionEvidenceUrl;

      // Allow member to toggle subtasks
      if (Array.isArray(subtasks)) {
        task.subtasks = subtasks;
      }

      task.history.unshift({
        timestamp: nowIso,
        actorName: actor.fullName || actor.email,
        actorRole: actor.role,
        action: "TASK_PROGRESS_UPDATED",
        details: `Updated status to ${task.status}.`,
      });
    } else {
      // VP, President, Admin: Full editing capabilities

      // Dependency validation
      if (Array.isArray(dependsOnTaskIds)) {
        if (hasCircularDependency(task.id, dependsOnTaskIds, tasks)) {
          return NextResponse.json(
            {
              success: false,
              error: "Circular dependency detected: Task cannot depend on a task that directly or indirectly depends on it.",
            },
            { status: 400 }
          );
        }
        task.dependsOnTaskIds = dependsOnTaskIds;
      }

      // Prerequisite completion check if setting status to completed
      const targetStatus = status || task.status;
      if (targetStatus === "completed" && Array.isArray(task.dependsOnTaskIds) && task.dependsOnTaskIds.length > 0) {
        const incompletePrereq = tasks.find(
          (t) => task.dependsOnTaskIds?.includes(t.id) && t.status !== "completed"
        );
        if (incompletePrereq) {
          return NextResponse.json(
            {
              success: false,
              error: `Cannot mark task as completed: Prerequisite task '${incompletePrereq.title}' must be completed first.`,
            },
            { status: 400 }
          );
        }
      }

      // Reassignment detection
      if (memberId && memberId !== task.memberId) {
        const fromName = task.memberName;
        const toName = memberName || "Member";
        const reason = reassignmentReason?.trim() || `Reassigned by ${actor.fullName || actor.role}`;

        task.reassignmentHistory.unshift({
          fromMemberId: task.memberId,
          fromMemberName: fromName,
          toMemberId: memberId,
          toMemberName: toName,
          reassignedBy: actor.fullName || actor.email,
          reassignedAt: nowIso,
          reason,
        });

        task.history.unshift({
          timestamp: nowIso,
          actorName: actor.fullName || actor.email,
          actorRole: actor.role,
          action: "TASK_REASSIGNED",
          details: `Reassigned from ${fromName} to ${toName}. Reason: ${reason}`,
        });

        task.memberId = memberId;
        task.memberName = toName;
        if (memberEmail) task.memberEmail = memberEmail;

        // Notify new assignee
        saveStoredNotification({
          id: `notif-${Date.now()}`,
          title: "Task Reassigned to You",
          message: `Task '${task.title}' for '${task.eventTitle}' was reassigned to you. Reason: ${reason}`,
          type: "task",
          targetRole: "AVISHKAR Member",
          link: "/admin/member",
          read: false,
          createdAt: nowIso,
          actorName: actor.fullName || actor.role,
        });
      }

      if (status) task.status = status as TaskStatus;
      if (notes !== undefined) task.notes = notes;
      if (title) task.title = title.trim();
      if (description !== undefined) task.description = description.trim();
      if (priority) task.priority = priority as TaskPriority;
      if (dueDate) task.dueDate = dueDate;
      if (dueTime) task.dueTime = dueTime;
      if (completionCriteria !== undefined) task.completionCriteria = completionCriteria.trim();
      if (completionNotes !== undefined) task.completionNotes = completionNotes.trim();
      if (completionEvidenceUrl !== undefined) task.completionEvidenceUrl = completionEvidenceUrl.trim();
      if (Array.isArray(subtasks)) task.subtasks = subtasks;

      task.history.unshift({
        timestamp: nowIso,
        actorName: actor.fullName || actor.email,
        actorRole: actor.role,
        action: "TASK_UPDATED",
        details: `Task updated by ${actor.fullName || actor.role}. Status: ${task.status}.`,
      });
    }

    if (task.status === "completed") {
      task.completedAt = task.completedAt || nowIso;
    } else {
      delete task.completedAt;
    }
    task.updatedAt = nowIso;

    saveStoredTask(task);

    // If member reports blocked status, notify Vice President
    if (userRole === "AVISHKAR Member" && status) {
      saveStoredNotification({
        id: `notif-${Date.now()}`,
        title: status === "blocked" ? "Duty Task Blocked Alert" : "Task Status Updated",
        message: `Member updated task '${task.title}' status to '${status}'.`,
        type: "task",
        targetRole: "Vice President",
        link: "/admin/vice-president",
        read: false,
        createdAt: nowIso,
        actorName: actor.fullName || actor.role,
      });
    }

    await logAdminAction({
      action: "TASK_STATUS_UPDATED",
      actor,
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

    // Check if any other task depends on this task
    const dependentTask = store.tasks.find((t) => t.dependsOnTaskIds?.includes(taskId));
    if (dependentTask) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete task: '${dependentTask.title}' depends on this task. Remove the dependency first.`,
        },
        { status: 400 }
      );
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
