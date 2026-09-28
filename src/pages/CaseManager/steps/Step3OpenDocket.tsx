import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "@components/form/date-picker.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FieldLabel,
  TextAreaInput,
  TextInput,
  type StepHandle,
} from "./_shared";
import { MatterDocketDefaultValue, MatterDocketFormData, MatterDocketSchema } from "../CaseTypes";
import { useAppDispatch, useAppSelector } from "@appAssets/hooks/useAppDispatch";
import { ApiService } from "@apiServices/ApiService";
import { notifyMessage } from "@appAssets/utils/JToast.tsx";
import { setStep3Success, updateDocketSuccess } from "@appAssets/store/caseSlice";

const STAGES: { value: string; label: string }[] = [
  { value: "pleadings", label: "Pleadings" },
  { value: "pre_trial", label: "Pre-trial" },
  { value: "trial", label: "Trial" },
  { value: "arguments", label: "Arguments" },
  { value: "judgment", label: "Judgment" },
  { value: "execution", label: "Execution" },
];

const STAGE_COLORS: Record<string, string> = {
  pleadings: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  pre_trial: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  trial: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  arguments: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  judgment: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  execution: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

function DocketList({
  dockets,
  activeDocketId,
  onEdit,
  onToggleStatus,
}: {
  dockets: any[];
  activeDocketId: number | null;
  onEdit: (docket: any) => void;
  onToggleStatus: (docket: any) => void;
}) {
  if (dockets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <i className="ti ti-gavel text-2xl text-gray-400" />
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400">No dockets opened yet.</p>
        <p className="mt-1 text-xs text-gray-400">Use the &quot;Open New Docket&quot; tab to create one.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {dockets.map((d) => {
        const isActive = d.id === activeDocketId || d.status === "open";
        const stageCls = STAGE_COLORS[d.stage] ?? "bg-gray-100 text-gray-600";
        return (
          <li
            key={d.id}
            className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${isActive
              ? "border-brand-300 bg-brand-50 dark:border-brand-600 dark:bg-brand-500/10"
              : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
              }`}
          >
            {/* Icon */}
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isActive
                ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
            >
              <i className="ti ti-gavel text-base" />
            </span>

            {/* Body */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                  {d.docketNumber || <span className="italic text-gray-400">Pending</span>}
                </span>
                {isActive && (
                  <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Active
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${stageCls}`}>
                  {d.stage ?? "—"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${d.status === "open"
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                >
                  {d.status ?? "—"}
                </span>
              </div>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {[d.courtName, d.bench].filter(Boolean).join(" · ")}
              </p>

              <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500">
                {d.openedDate && (
                  <span>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Opened:</span>{" "}
                    {d.openedDate}
                  </span>
                )}
                {d.nextHearingDate && (
                  <span>
                    <span className="font-medium text-gray-500 dark:text-gray-400">Next hearing:</span>{" "}
                    {d.nextHearingDate}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-1.5 self-start">
              <button
                type="button"
                onClick={() => onEdit(d)}
                className="flex items-center gap-1 rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:border-brand-400 hover:bg-brand-100 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
              >
                <i className="ti ti-pencil text-sm" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onToggleStatus(d)}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${d.status === "open"
                  ? "border-error-300 bg-error-50 text-error-600 hover:border-error-400 hover:bg-error-100 dark:border-error-500/50 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20"
                  : "border-success-300 bg-success-50 text-success-600 hover:border-success-400 hover:bg-success-100 dark:border-success-500/50 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20"
                  }`}
              >
                <i className={`ti ${d.status === "open" ? "ti-lock" : "ti-lock-open"} text-sm`} />
                {d.status === "open" ? "Close Docket" : "Reopen Docket"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default forwardRef<StepHandle>(function Step3OpenDocket(_, ref) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm<MatterDocketFormData>({
    defaultValues: MatterDocketDefaultValue,
    resolver: zodResolver(MatterDocketSchema),
  });

  const dispatch = useAppDispatch();
  const matterId = useAppSelector((s) => s.case.matterId);
  const caseId = useAppSelector((s) => s.case.caseId);
  const docketId = useAppSelector((s) => s.case.docketId);
  const savedStep3Data = useAppSelector((s) => s.case.step3Data);
  const dockets = useAppSelector((s) => s.case.dockets);

  const [activeTab, setActiveTab] = useState<"list" | "form">(dockets.length > 0 ? "list" : "form");
  // tracks which docket is loaded in the form; null = new docket (POST)
  const [editingDocketId, setEditingDocketId] = useState<number | null>(docketId);
  // drives the tab label only — decoupled from editingDocketId
  const [isEditMode, setIsEditMode] = useState(false);
  const [clearKey, setClearKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Restore last entered data when navigating back — also re-runs once the async
  // edit-mode fetch (loadMatterForEditAsync) populates step3Data after this mounts
  useEffect(() => {
    if (savedStep3Data) {
      reset(savedStep3Data);
    } else if (caseId) {
      reset({ ...MatterDocketDefaultValue, caseId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedStep3Data]);

  /** Map raw API docket object into form shape and open it for editing. */
  const handleEdit = (raw: any) => {
    reset({
      id: raw.id ?? null,
      matterId: raw.matterId ?? matterId,
      caseId: raw.caseId ?? caseId,
      docketNumber: raw.docketNumber ?? "",
      courtName: raw.courtName ?? "",
      bench: raw.bench ?? "",
      stage: raw.stage ?? "pleadings",
      openedDate: raw.openedDate ?? null,
      nextHearingDate: raw.nextHearingDate ?? null,
      notes: raw.notes ?? "",
    });
    setEditingDocketId(raw.id);
    setIsEditMode(true);
    setClearKey((k) => k + 1);
    setActiveTab("form");
  };

  /** Switch to the form in "new docket" mode. */
  const handleOpenNew = () => {
    reset({ ...MatterDocketDefaultValue, caseId });
    setEditingDocketId(null);
    setIsEditMode(false);
    setClearKey((k) => k + 1);
    setActiveTab("form");
  };

  const handleToggleStatus = async (docket: any) => {
    if (!matterId) return;
    const status = docket.status === "open" ? "closed" : "open";
    const targetCaseId = docket.caseId ?? caseId;
    if (!targetCaseId) {
      notifyMessage("A case is required to update docket status", "ERROR");
      return;
    }
    try {
      const response = await ApiService.getInstance().caseService.updateDocketStatus(
        docket.matterId ?? matterId,
        docket.id,
        targetCaseId,
        status,
      );
      if (response.hasData) {
        dispatch(updateDocketSuccess(response.data.data));
        notifyMessage(`Docket ${status === "closed" ? "closed" : "reopened"}`, "SUCCESS");
      } else {
        notifyMessage(`Failed to ${status === "closed" ? "close" : "reopen"} the docket`, "ERROR");
      }
    } catch (err) {
      notifyMessage(`Failed to ${status === "closed" ? "close" : "reopen"} the docket`, "ERROR");
      console.error("docket status API failed:", err);
    }
  };

  const handleSave = () =>
    new Promise<boolean>((resolve) => {
      if (!matterId) {
        notifyMessage("Complete client intake (step 1) first", "ERROR");
        resolve(false);
        return;
      }
      handleSubmit(
        async (data: MatterDocketFormData) => {
          try {
            setIsSaving(true);
            const payload = { ...data, caseId: data.caseId ?? caseId };
            const response = editingDocketId
              ? await ApiService.getInstance().caseService.updateDocket(matterId, editingDocketId, payload)
              : await ApiService.getInstance().caseService.openDocket(matterId, payload);

            if (response.hasData) {
              dispatch(setStep3Success({ formData: payload, response: response.data.data }));
              notifyMessage("The docket has been successfully saved", "SUCCESS");
              resolve(true);
            } else {
              notifyMessage("Failed to save the docket", "ERROR");
              resolve(false);
            }
          } catch (err) {
            notifyMessage("Failed to save the docket", "ERROR");
            console.error("matter-docket API failed:", err);
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
    clear: () => { reset(MatterDocketDefaultValue); setEditingDocketId(null); setIsEditMode(false); setClearKey((k) => k + 1); },
  }));

  return (
    <div>
      {/* Sub-tab bar + Save */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/60">
          <button
            type="button"
            onClick={() => {
              isEditMode && setIsEditMode(false);
              setActiveTab("list");
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "list"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-list text-sm" />
          Dockets
          {dockets.length > 0 && (
            <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
              {dockets.length}
            </span>
          )}
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "form"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-gavel text-sm" />
            {isEditMode ? "Edit Docket" : "Open New Docket"}
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

      {/* Tab: Docket list */}
      {activeTab === "list" && (
        <DocketList dockets={dockets} activeDocketId={docketId} onEdit={handleEdit} onToggleStatus={handleToggleStatus} />
      )}

      {/* Tab: Docket form */}
      {activeTab === "form" && (
        <form onSubmit={(e) => e.preventDefault()}>
          {/* <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
        <i className="ti ti-clipboard-list text-brand-500" />
        Step 3 — Open a docket
      </h3>
      <p className="mb-5 text-sm text-gray-500">
        A docket is the official court register for this matter. One case can have multiple dockets
        (e.g. HC + SC).
      </p> */}

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>Docket / case no.</FieldLabel>
              <TextInput placeholder="(Pending — to be assigned by court)" {...register("docketNumber")} />
            </div>
            <div>
              <FieldLabel>Court registration date</FieldLabel>
              {/* <TextInput type="date" {...register("openedDate")} /> */}
              <Controller
                control={control}
                name="openedDate"
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
                      id="openedDate-date-picker"
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
              <FieldLabel>Next hearing date</FieldLabel>
              {/* <TextInput type="date" {...register("nextHearingDate")} /> */}
              <Controller
                control={control}
                name="nextHearingDate"
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
                      id="nextHearingDate-picker"
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

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Court name</FieldLabel>
              <TextInput placeholder="e.g. Bombay High Court" {...register("courtName")} />
            </div>
            <div>
              <FieldLabel>Bench</FieldLabel>
              <TextInput placeholder="e.g. Commercial Bench" {...register("bench")} />
            </div>
          </div>

          <div className="mb-3">
            <FieldLabel>Stage at opening</FieldLabel>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              {...register("stage")}
            >
              {STAGES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <FieldLabel>Notes</FieldLabel>
            <TextAreaInput placeholder="Any opening remarks…" {...register("notes")} />
          </div>
        </form>
      )}
    </div>
  );
});
