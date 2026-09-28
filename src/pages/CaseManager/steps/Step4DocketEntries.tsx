import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "@components/form/date-picker.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@components/ui/modal";
import {
  Badge,
  FieldLabel,
  SectionLabel,
  TextAreaInput,
  TextInput,
  type BadgeColor,
  type StepHandle,
} from "./_shared";
import { DocketEntryDefaultValue, DocketEntryFormData, DocketEntrySchema } from "../CaseTypes";
import { useAppDispatch, useAppSelector } from "@appAssets/hooks/useAppDispatch";
import { ApiService } from "@apiServices/ApiService";
import { notifyMessage } from "@appAssets/utils/JToast.tsx";
import {
  addDocketEntrySuccess,
  setDocketEntries,
  updateDocketEntrySuccess,
} from "@appAssets/store/caseSlice";

const ENTRY_TYPES: { value: string; label: string; badge: BadgeColor }[] = [
  { value: "filing", label: "Filing", badge: "purple" },
  { value: "court_order", label: "Court order", badge: "teal" },
  { value: "hearing", label: "Hearing", badge: "amber" },
  { value: "notice", label: "Notice", badge: "amber" },
  { value: "judgment", label: "Judgment", badge: "teal" },
  { value: "vakalatnama", label: "Vakalatnama", badge: "purple" },
  { value: "affidavit", label: "Affidavit", badge: "purple" },
  { value: "other", label: "Other", badge: "gray" },
];

const OUTCOME_COLORS: Record<string, string> = {
  adjourned: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  argued: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  order_passed: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  disposed: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
};

// ─── Entry list sub-component ─────────────────────────────────────────────────

function EntryList({
  entries,
  onEdit,
}: {
  entries: DocketEntryFormData[];
  onEdit: (entry: DocketEntryFormData) => void;
}) {
  const [viewingEntry, setViewingEntry] = useState<DocketEntryFormData | null>(null);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <i className="ti ti-calendar-event text-2xl text-gray-400" />
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400">No docket entries yet.</p>
        <p className="mt-1 text-xs text-gray-400">Use the &quot;Add Entry&quot; tab to create one.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
      {entries.map((entry) => {
        const typeMeta = ENTRY_TYPES.find((t) => t.value === entry.entryType);
        const outcomeCls = entry.hearingOutcome
          ? (OUTCOME_COLORS[entry.hearingOutcome] ?? "bg-gray-100 text-gray-600")
          : null;
        return (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-colors dark:border-gray-800 dark:bg-gray-900"
          >
            {/* Type icon */}
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <i className="ti ti-calendar-event text-base" />
            </span>

            {/* Body */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                  {entry.title || <span className="italic text-gray-400">Untitled</span>}
                </span>
                {typeMeta && <Badge color={typeMeta.badge}>{typeMeta.label}</Badge>}
                {outcomeCls && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${outcomeCls}`}>
                    {entry.hearingOutcome.replace("_", " ")}
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500">
                {entry.entryDate && (
                  <span>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Date:</span>{" "}
                    {entry.entryDate}
                  </span>
                )}
                {entry.nextDate && (
                  <span>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Next:</span>{" "}
                    {entry.nextDate}
                  </span>
                )}
                {entry.reminderDays != null && (
                  <span>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Reminder:</span>{" "}
                    {entry.reminderDays}d
                  </span>
                )}
              </div>

              {entry.description && (
                <p className="mt-1.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {entry.description}
                </p>
              )}
            </div>

            {/* View / Edit actions */}
            <div className="flex shrink-0 flex-col gap-1.5 self-start">
              <button
                type="button"
                onClick={() => setViewingEntry(entry)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:hover:border-brand-600 dark:hover:text-brand-400"
              >
                <i className="ti ti-eye text-sm" />
                View
              </button>
              <button
                type="button"
                onClick={() => onEdit(entry)}
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
        isOpen={viewingEntry !== null}
        onClose={() => setViewingEntry(null)}
        width="520px"
        overlayClassName="bg-black/40"
      >
        {viewingEntry && (() => {
          const typeMeta = ENTRY_TYPES.find((t) => t.value === viewingEntry.entryType);
          const outcomeCls = viewingEntry.hearingOutcome
            ? (OUTCOME_COLORS[viewingEntry.hearingOutcome] ?? "bg-gray-100 text-gray-600")
            : null;
          return (
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                    {viewingEntry.title || "Untitled Entry"}
                  </h3>
                  {typeMeta && <Badge color={typeMeta.badge}>{typeMeta.label}</Badge>}
                  {outcomeCls && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${outcomeCls}`}>
                      {viewingEntry.hearingOutcome.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {viewingEntry.entryNo && (
                  <>
                    <dt className="text-gray-500">Entry no.</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-100">{viewingEntry.entryNo}</dd>
                  </>
                )}
                <dt className="text-gray-500">Entry date</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-100">{viewingEntry.entryDate || "—"}</dd>
                {viewingEntry.nextDate && (
                  <>
                    <dt className="text-gray-500">Next date</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-100">{viewingEntry.nextDate}</dd>
                  </>
                )}
                {viewingEntry.reminderDays != null && (
                  <>
                    <dt className="text-gray-500">Reminder</dt>
                    <dd className="font-medium text-gray-800 dark:text-gray-100">{viewingEntry.reminderDays} days before next date</dd>
                  </>
                )}
              </dl>

              {viewingEntry.description && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
                  <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">{viewingEntry.description}</p>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingEntry(null)}
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

export default forwardRef<StepHandle>(function Step4DocketEntries(_, ref) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm<DocketEntryFormData>({
    defaultValues: DocketEntryDefaultValue,
    resolver: zodResolver(DocketEntrySchema),
  });

  const dispatch = useAppDispatch();
  const matterId = useAppSelector((s) => s.case.matterId);
  const docketId = useAppSelector((s) => s.case.docketId);
  const entries = useAppSelector((s) => s.case.docketEntries);

  const [activeTab, setActiveTab] = useState<"list" | "form">(entries.length > 0 ? "list" : "form");
  // null = POST (new entry), number = PUT (edit by id)
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  // drives tab label only — decoupled from editingEntryId
  const [isEditMode, setIsEditMode] = useState(false);
  const [clearKey, setClearKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing docket entries when the step is shown
  useEffect(() => {
    (async () => {
      if (!matterId || !docketId) return;
      try {
        const response = await ApiService.getInstance().caseService.listDocketEntries(matterId, docketId);
        if (response.data?.hasData) {
          dispatch(setDocketEntries(response.data.data));
        }
      } catch (err) {
        console.error("docket-entry list API failed:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterId, docketId]);

  /** Populate the form with an existing entry for editing. */
  const handleEdit = (entry: DocketEntryFormData) => {
    reset({ ...entry });
    setEditingEntryId(entry.id);
    setIsEditMode(true);
    setClearKey((k) => k + 1);
    setActiveTab("form");
  };

  /** Switch to the form in "new entry" mode. */
  const handleAddNew = () => {
    reset({ ...DocketEntryDefaultValue, docketId });
    setEditingEntryId(null);
    setIsEditMode(false);
    setClearKey((k) => k + 1);
    setActiveTab("form");
  };

  const handleSave = () =>
    new Promise<boolean>((resolve) => {
      if (!matterId || !docketId) {
        notifyMessage("Open a docket (step 3) first", "ERROR");
        resolve(false);
        return;
      }
      handleSubmit(
        async (data: DocketEntryFormData) => {
          try {
            setIsSaving(true);
            const payload = { ...data, docketId };
            const response = editingEntryId
              ? await ApiService.getInstance().caseService.updateDocketEntry(
                  matterId,
                  docketId,
                  editingEntryId,
                  payload,
                )
              : await ApiService.getInstance().caseService.addDocketEntry(matterId, docketId, payload);

            if (response.hasData) {
              dispatch(
                editingEntryId
                  ? updateDocketEntrySuccess(response.data.data)
                  : addDocketEntrySuccess(response.data.data),
              );
              notifyMessage("Docket entry saved successfully", "SUCCESS");
              setActiveTab("list");
              setEditingEntryId(null);
              setIsEditMode(false);
              resolve(true);
            } else {
              notifyMessage("Failed to save the docket entry", "ERROR");
              resolve(false);
            }
          } catch (err) {
            notifyMessage("Failed to save the docket entry", "ERROR");
            console.error("docket-entry API failed:", err);
            resolve(false);
          } finally {
            setIsSaving(false);
          }
        },
        () => resolve(false),
      )();
    });

  useImperativeHandle(ref, () => ({
    submit: handleSave,
    clear: () => {
      reset(DocketEntryDefaultValue);
      setEditingEntryId(null);
      setIsEditMode(false);
      setClearKey((k) => k + 1);
    },
  }));

  return (
    <div>
      {/* Sub-tab bar + Save */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/60">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "list"
                ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <i className="ti ti-list text-sm" />
            Entries
            {entries.length > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                {entries.length}
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
            <i className="ti ti-calendar-plus text-sm" />
            {isEditMode ? "Edit Entry" : "Add Entry"}
          </button>
        </div>

        {activeTab === "form" && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-default disabled:opacity-50"
          >
            <i className="ti ti-device-floppy text-sm" />
            {isSaving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      {/* Tab: Entries list */}
      {activeTab === "list" && <EntryList entries={entries} onEdit={handleEdit} />}

      {/* Tab: Entry form */}
      {activeTab === "form" && (
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Entry type</FieldLabel>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                {...register("entryType")}
              >
                {ENTRY_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Entry date</FieldLabel>
              <Controller
                control={control}
                name="entryDate"
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
                      id="entryDate-date-picker"
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
              {errors.entryDate && <p className="mt-1 text-xs text-error-500">{errors.entryDate.message}</p>}
            </div>
            <div>
              <FieldLabel>Next date</FieldLabel>
              <Controller
                control={control}
                name="nextDate"
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
                      id="nextDate-date-picker"
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
          </div>

          <div className="mb-3">
            <FieldLabel>Title</FieldLabel>
            <TextInput placeholder="e.g. Court admits case & issues notice" {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-error-500">{errors.title.message}</p>}
          </div>

          <div className="mb-4">
            <FieldLabel>Description</FieldLabel>
            <TextAreaInput
              placeholder="e.g. Court issued notice to respondents returnable on 10-Jun-2025."
              {...register("description")}
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Reminder (days before next date)</FieldLabel>
              <TextInput type="number" {...register("reminderDays", { valueAsNumber: true })} />
            </div>
            <div>
              <FieldLabel>Hearing outcome</FieldLabel>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                {...register("hearingOutcome")}
              >
                <option value="">—</option>
                {["adjourned", "argued", "order_passed", "disposed"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <SectionLabel>Entry no. (optional)</SectionLabel>
          <div className="mb-3">
            <TextInput placeholder="e.g. #001 — auto-assigned if left blank" {...register("entryNo")} />
          </div>
        </form>
      )}
    </div>
  );
});
