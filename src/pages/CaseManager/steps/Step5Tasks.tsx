import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "@components/form/date-picker.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@components/ui/modal";
import { Badge, FieldLabel, SectionLabel, TextAreaInput, TextInput, type BadgeColor, type StepHandle } from "./_shared";
import { MatterTaskDefaultValue, MatterTaskFormData, MatterTaskSchema } from "../CaseTypes";
import { useAppDispatch, useAppSelector } from "@appAssets/hooks/useAppDispatch";
import { ApiService } from "@apiServices/ApiService";
import { notifyMessage } from "@appAssets/utils/JToast.tsx";
import { addTaskSuccess, loadTenantUsersAsync, setTasks, updateTaskSuccess } from "@appAssets/store/caseSlice";

const PRIORITIES: { value: string; label: string; badge: BadgeColor }[] = [
  { value: "low", label: "Low", badge: "light" },
  { value: "normal", label: "Normal", badge: "primary" },
  { value: "high", label: "High", badge: "amber" },
  { value: "urgent", label: "Urgent", badge: "error" },
];

const STATUSES: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  review: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  completed: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const selectCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

function badgeForPriority(priority: string): BadgeColor {
  return PRIORITIES.find((p) => p.value === priority)?.badge ?? "light";
}

// ─── Task list sub-component ──────────────────────────────────────────────────

function TaskList({
  tasks,
  tenantUsers,
  onEdit,
  onToggle,
}: {
  tasks: any[];
  tenantUsers: any[];
  onEdit: (task: any) => void;
  onToggle: (taskId: number, status?: string) => void;
}) {
  const [viewingTask, setViewingTask] = useState<any | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <i className="ti ti-checklist text-2xl text-gray-400" />
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400">No tasks yet.</p>
        <p className="mt-1 text-xs text-gray-400">Use the &quot;Add Task&quot; tab to create one.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {tasks.map((task) => {
          const statusCls = STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-600";
          const assignedUser = tenantUsers.find((u: any) => u.id === task.assignedTo);
          return (
            <li
              key={task.id}
              className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-colors dark:border-gray-800 dark:bg-gray-900"
            >
              {/* Complete toggle */}
              <button
                type="button"
                onClick={() => onToggle(task.id!, task.status)}
                aria-label={task.status === "completed" ? "Completed" : "Mark complete"}
                disabled={task.status === "completed"}
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  task.status === "completed"
                    ? "border-success-500 bg-success-50 dark:bg-success-500/20"
                    : "border-gray-300 hover:border-brand-400 dark:border-gray-600"
                }`}
              >
                {task.status === "completed" && (
                  <svg className="h-3 w-3 text-success-600" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Body */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold ${task.status === "completed" ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-800 dark:text-white"}`}>
                    {task.taskName}
                  </span>
                  <Badge color={badgeForPriority(task.priority)}>
                    {PRIORITIES.find((p) => p.value === task.priority)?.label ?? task.priority}
                  </Badge>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusCls}`}>
                    {STATUSES.find((s) => s.value === task.status)?.label ?? task.status}
                  </span>
                  {task.category && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {task.category}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500">
                  {task.startDate && (
                    <span><span className="font-medium text-gray-500 dark:text-gray-400">Start:</span> {task.startDate}</span>
                  )}
                  {task.dueDate && (
                    <span><span className="font-medium text-gray-500 dark:text-gray-400">Due:</span> {task.dueDate}</span>
                  )}
                  {assignedUser && (
                    <span><span className="font-medium text-gray-500 dark:text-gray-400">Assigned:</span> {assignedUser.name}</span>
                  )}
                </div>

                {task.subTasks?.length > 0 && (
                  <div className="mt-1.5 flex flex-col gap-1">
                    {task.subTasks.map((sub: any) => (
                      <div key={sub.id ?? sub.taskName} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
                        {sub.taskName}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* View / Edit actions */}
              <div className="flex shrink-0 flex-col gap-1.5 self-start">
                <button
                  type="button"
                  onClick={() => setViewingTask(task)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:border-brand-600 dark:hover:text-brand-400"
                >
                  <i className="ti ti-eye text-sm" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:border-brand-600 dark:hover:text-brand-400"
                >
                  <i className="ti ti-pencil text-sm" />
                  Edit
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* View detail modal */}
      <Modal
        isOpen={viewingTask !== null}
        onClose={() => setViewingTask(null)}
        width="520px"
        overlayClassName="bg-black/40"
      >
        {viewingTask && (() => {
          const statusCls = STATUS_COLORS[viewingTask.status] ?? "bg-gray-100 text-gray-600";
          const assignedUser = tenantUsers.find((u: any) => u.id === viewingTask.assignedTo);
          return (
            <div className="p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                  {viewingTask.taskName}
                </h3>
                <Badge color={badgeForPriority(viewingTask.priority)}>
                  {PRIORITIES.find((p) => p.value === viewingTask.priority)?.label ?? viewingTask.priority}
                </Badge>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusCls}`}>
                  {STATUSES.find((s) => s.value === viewingTask.status)?.label ?? viewingTask.status}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {viewingTask.category && (
                  <>
                    <dt className="text-gray-500">Category</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-100">{viewingTask.category}</dd>
                  </>
                )}
                {viewingTask.startDate && (
                  <>
                    <dt className="text-gray-500">Start date</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-100">{viewingTask.startDate}</dd>
                  </>
                )}
                {viewingTask.dueDate && (
                  <>
                    <dt className="text-gray-500">Due date</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-100">{viewingTask.dueDate}</dd>
                  </>
                )}
                {assignedUser && (
                  <>
                    <dt className="text-gray-500">Assigned to</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-100">{assignedUser.name} ({assignedUser.username})</dd>
                  </>
                )}
                {viewingTask.completedAt && (
                  <>
                    <dt className="text-gray-500">Completed at</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-100">{viewingTask.completedAt}</dd>
                  </>
                )}
              </dl>

              {viewingTask.taskDetails && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Details</p>
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{viewingTask.taskDetails}</p>
                </div>
              )}

              {viewingTask.subTasks?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Sub-tasks</p>
                  <ul className="flex flex-col gap-1.5">
                    {viewingTask.subTasks.map((sub: any) => (
                      <li key={sub.id ?? sub.taskName} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
                        {sub.taskName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingTask(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}

// ─── Main step component ──────────────────────────────────────────────────────

export default forwardRef<StepHandle>(function Step5Tasks(_, ref) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<MatterTaskFormData>({
    defaultValues: MatterTaskDefaultValue,
    resolver: zodResolver(MatterTaskSchema),
  });

  const dispatch = useAppDispatch();
  const matterId = useAppSelector((s) => s.case.matterId);
  const caseId = useAppSelector((s) => s.case.caseId);
  const docketId = useAppSelector((s) => s.case.docketId);
  const tasks = useAppSelector((s) => s.case.tasks);
  const tenantUsers = useAppSelector((s) => s.case.tenantUsers);

  const [activeTab, setActiveTab] = useState<"list" | "form">(tasks.length > 0 ? "list" : "form");
  // null = POST (new task), number = PUT (edit by id)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  // drives tab label only — decoupled from editingTaskId
  const [isEditMode, setIsEditMode] = useState(false);
  const [clearKey, setClearKey] = useState(0);

  useEffect(() => {
    (async () => {
      if (!matterId) return;
      try {
        const response = await ApiService.getInstance().caseService.listTasks(matterId);
        if (response.data?.hasData) {
          dispatch(setTasks(response.data.data));
        }
      } catch (err) {
        console.error("task list API failed:", err);
      }
    })();
    dispatch(loadTenantUsersAsync());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterId]);

  /** Populate the form with an existing task for editing. */
  const handleEdit = (task: any) => {
    reset({ ...task, subTasks: task.subTasks ?? [] });
    setEditingTaskId(task.id);
    setIsEditMode(true);
    setClearKey((k) => k + 1);
    setActiveTab("form");
  };

  /** Switch to the form in "new task" mode. */
  const handleAddNew = () => {
    reset({ ...MatterTaskDefaultValue, caseId, docketId });
    setEditingTaskId(null);
    setIsEditMode(false);
    setClearKey((k) => k + 1);
    setActiveTab("form");
  };

  const saveTask = handleSubmit(
    async (data: MatterTaskFormData) => {
      if (!matterId) {
        notifyMessage("Complete client intake (step 1) first", "ERROR");
        return false;
      }
      try {
        const payload = { ...data, caseId: data.caseId ?? caseId, docketId: data.docketId ?? docketId };
        const response = editingTaskId
          ? await ApiService.getInstance().caseService.updateTask(matterId, editingTaskId, payload)
          : await ApiService.getInstance().caseService.createTask(matterId, payload);

        if (response.hasData) {
          dispatch(editingTaskId ? updateTaskSuccess(response.data.data) : addTaskSuccess(response.data.data));
          notifyMessage("Task saved successfully", "SUCCESS");
          setActiveTab("list");
          setEditingTaskId(null);
          setIsEditMode(false);
          return true;
        }
        notifyMessage("Failed to save the task", "ERROR");
        return false;
      } catch (err) {
        notifyMessage("Failed to save the task", "ERROR");
        console.error("task API failed:", err);
        return false;
      }
    },
    () => false,
  );

  useImperativeHandle(ref, () => ({
    submit: () => saveTask().then(() => true).catch(() => false),
    clear: () => {
      reset(MatterTaskDefaultValue);
      setEditingTaskId(null);
      setIsEditMode(false);
      setClearKey((k) => k + 1);
    },
  }));

  const toggle = async (taskId: number, status?: string) => {
    if (!matterId || status === "completed") return;
    try {
      const response = await ApiService.getInstance().caseService.completeTask(matterId, taskId);
      if (response.hasData) {
        dispatch(updateTaskSuccess(response.data.data));
      }
    } catch (err) {
      notifyMessage("Failed to complete the task", "ERROR");
      console.error("task-complete API failed:", err);
    }
  };

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/60">
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "list"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <i className="ti ti-checklist text-sm" />
          Tasks
          {tasks.length > 0 && (
            <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
              {tasks.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={handleAddNew}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "form"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <i className="ti ti-circle-plus text-sm" />
          {isEditMode ? "Edit Task" : "Add Task"}
        </button>
      </div>

      {/* Tab: Task list */}
      {activeTab === "list" && (
        <TaskList tasks={tasks} tenantUsers={tenantUsers} onEdit={handleEdit} onToggle={toggle} />
      )}

      {/* Tab: Task form */}
      {activeTab === "form" && (
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <FieldLabel>Task name</FieldLabel>
              <TextInput placeholder="e.g. Prepare injunction application bundle" {...register("taskName")} />
              {errors.taskName && <p className="mt-1 text-xs text-error-500">{errors.taskName.message}</p>}
            </div>
            <div>
              <FieldLabel>Category</FieldLabel>
              <TextInput placeholder="e.g. Filing" {...register("category")} />
            </div>
          </div>

          <div className="mb-3">
            <FieldLabel>Task details</FieldLabel>
            <TextAreaInput placeholder="Describe what needs to be done…" {...register("taskDetails")} />
          </div>

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Start date</FieldLabel>
              <Controller
                control={control}
                name="startDate"
                render={({ field }) => {
                  const defaultDate = (() => {
                    if (!field.value) return undefined;
                    const parts = (field.value as string).split("/");
                    if (parts.length === 3) {
                      const [dd, mm, yyyy] = parts;
                      return new Date(`${yyyy}-${mm}-${dd}`);
                    }
                    return undefined;
                  })();
                  return (
                    <DatePicker
                      key={clearKey}
                      id="startDate-date-picker"
                      placeholder="dd/MM/yyyy"
                      defaultDate={defaultDate}
                      onChange={(dates) => {
                        if (dates[0]) {
                          const d = dates[0];
                          const dd = String(d.getDate()).padStart(2, "0");
                          const mm = String(d.getMonth() + 1).padStart(2, "0");
                          const yyyy = d.getFullYear();
                          field.onChange(`${dd}/${mm}/${yyyy}`);
                        } else {
                          field.onChange(null);
                        }
                      }}
                      onClear={() => { field.onChange(null); setClearKey((k) => k + 1); }}
                    />
                  );
                }}
              />
            </div>
            <div>
              <FieldLabel>Due date</FieldLabel>
              <Controller
                control={control}
                name="dueDate"
                render={({ field }) => {
                  const defaultDate = (() => {
                    if (!field.value) return undefined;
                    const parts = (field.value as string).split("/");
                    if (parts.length === 3) {
                      const [dd, mm, yyyy] = parts;
                      return new Date(`${yyyy}-${mm}-${dd}`);
                    }
                    return undefined;
                  })();
                  return (
                    <DatePicker
                      key={clearKey}
                      id="dueDate-date-picker"
                      placeholder="dd/MM/yyyy"
                      defaultDate={defaultDate}
                      onChange={(dates) => {
                        if (dates[0]) {
                          const d = dates[0];
                          const dd = String(d.getDate()).padStart(2, "0");
                          const mm = String(d.getMonth() + 1).padStart(2, "0");
                          const yyyy = d.getFullYear();
                          field.onChange(`${dd}/${mm}/${yyyy}`);
                        } else {
                          field.onChange(null);
                        }
                      }}
                      onClear={() => { field.onChange(null); setClearKey((k) => k + 1); }}
                    />
                  );
                }}
              />
            </div>
            <div>
              <FieldLabel>Priority</FieldLabel>
              <select className={selectCls} {...register("priority")}>
                {PRIORITIES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Status</FieldLabel>
              <select className={selectCls} {...register("status")}>
                {STATUSES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Assigned to</FieldLabel>
              <select
                className={selectCls}
                {...register("assignedTo", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
              >
                <option value="">Unassigned</option>
                {tenantUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Parent task</FieldLabel>
              <select
                className={selectCls}
                {...register("parentTaskId", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
              >
                <option value="">None — top-level task</option>
                {tasks
                  .filter((t) => t.id !== editingTaskId)
                  .map((t) => (
                    <option key={t.id} value={t.id!}>{t.taskName}</option>
                  ))}
              </select>
            </div>
          </div>

          <SectionLabel>Actions</SectionLabel>
          <button
            type="button"
            onClick={() => saveTask()}
            className="mb-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            <i className={`ti ${isEditMode ? "ti-device-floppy" : "ti-plus"} text-xs`} />
            {" "}{isEditMode ? "Update task" : "Add task"}
          </button>
        </form>
      )}
    </div>
  );
});
