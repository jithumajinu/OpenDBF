import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import DatePicker from "@components/form/date-picker.tsx";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FieldLabel,
  SelectInput,
  TextAreaInput,
  TextInput,
  AddRowButton,
  type StepHandle,
} from "./_shared";
import { MatterCaseDefaultValue, MatterCaseFormData, MatterCaseSchema } from "../CaseTypes";
import { useAppDispatch, useAppSelector } from "@appAssets/hooks/useAppDispatch";
import { ApiService } from "@apiServices/ApiService";
import { notifyMessage } from "@appAssets/utils/JToast.tsx";
import { setStep2Success, searchAdvocateMastersAsync, loadLocationDataAsync, type AdvocateMasterItem } from "@appAssets/store/caseSlice";
import { STATIC_DISTRICTS } from "../constants";
import type { CourtItem } from "../constants";
import { PlusUserIcon, TrashBinIcon } from "@appAssets/icons";

const CASE_TYPES = ["Civil suit", "Writ petition", "Criminal", "Arbitration"];
const FILING_METHODS: { value: string; label: string }[] = [
  { value: "e_filing", label: "e-Filing" },
  { value: "physical", label: "Physical filing" },
  { value: "hybrid", label: "Hybrid" },
];
const URGENCY_LEVELS: { value: string; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High — injunction needed" },
  { value: "urgent", label: "Urgent" },
];
const APPLICANT_TYPES: { value: number; label: string }[] = [
  { value: 1, label: "Advocate" },
  { value: 2, label: "Person" },
];
const PARTY_SIGNATURE_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "Yes" },
  { value: "2", label: "No" },
];
const ADVOCATE_ROLES = ["lead", "junior", "associate", "consultant"];
const PARTY_ROLES = ["petitioner", "respondent", "appellant", "intervenor", "amicus_curiae", "witness"];

export default forwardRef<StepHandle>(function Step2CreateCase(_, ref) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
    control,
  } = useForm<MatterCaseFormData>({
    defaultValues: MatterCaseDefaultValue,
    resolver: zodResolver(MatterCaseSchema),
  });

  const { fields: advocateFields, append: appendAdvocate, remove: removeAdvocate } = useFieldArray({
    control,
    name: "advocates",
  });

  const { fields: partyFields, append: appendParty, remove: removeParty } = useFieldArray({
    control,
    name: "parties",
  });

  const dispatch = useAppDispatch();
  const matterId = useAppSelector((s) => s.case.matterId);
  const caseId = useAppSelector((s) => s.case.caseId);
  const [isFormEditable, setIsFormEditable] = useState(!caseId);
  const savedStep2Data = useAppSelector((s) => s.case.step2Data);
  const advocateMasterResults = useAppSelector((s) => s.case.advocateMasterResults);
  const advocateMasterLoading = useAppSelector((s) => s.case.advocateMasterLoading);
  const states = useAppSelector((s) => s.case.states);
  const courts = useAppSelector((s) => s.case.courts);

  // UI-only — selected state ID for filtering courts; not sent to API
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  const filteredCourts: CourtItem[] = selectedStateId
    ? courts.filter((c) => c.stateId === selectedStateId)
    : [];

  const filteredDistricts = selectedStateId
    ? STATIC_DISTRICTS.filter((d) => d.stateId === selectedStateId)
    : [];

  const handleStateChange = (stateId: number | null) => {
    setSelectedStateId(stateId);
    setValue("courtId", null);    // clear court selection
    setValue("courtName", "");
    setValue("districtID", "");   // clear district — it belongs to the previous state
  };

  const handleCourtChange = (courtId: number) => {
    const court = courts.find((c) => c.id === courtId);
    setValue("courtId", courtId || null);
    setValue("courtName", court?.name ?? "");
  };

  // ── Advocate name autocomplete ────────────────────────────────────────────
  const [activeDropdownIdx, setActiveDropdownIdx] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Enrollment no autocomplete ────────────────────────────────────────────
  const [activeEnrollmentDropdownIdx, setActiveEnrollmentDropdownIdx] = useState<number | null>(null);
  const enrollmentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnrollmentNoChange = (idx: number, value: string) => {
    setValue(`advocates.${idx}.enrollmentNo`, value);
    setValue(`advocates.${idx}.id`, null as any);
    if (enrollmentDebounceRef.current) clearTimeout(enrollmentDebounceRef.current);
    enrollmentDebounceRef.current = setTimeout(() => {
      dispatch(searchAdvocateMastersAsync(value.trim()));
    }, 300);
    setActiveEnrollmentDropdownIdx(idx);
  };

  const handleAdvocateNameChange = (idx: number, value: string) => {
    setValue(`advocates.${idx}.advocateName`, value);
    setValue(`advocates.${idx}.id`, null as any); // clear master link when typing manually
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(searchAdvocateMastersAsync(value.trim()));
    }, 300);
    setActiveDropdownIdx(idx);
  };

  const handleSelectMaster = (idx: number, master: AdvocateMasterItem) => {
    setValue(`advocates.${idx}.id`, master.id as any);
    setValue(`advocates.${idx}.advocateName`, master.advocateName, { shouldValidate: true });
    setValue(`advocates.${idx}.enrollmentNo`, master.enrollmentNo ?? "");
    setValue(`advocates.${idx}.phone`, master.phone ?? "");
    setValue(`advocates.${idx}.email`, master.email ?? "");
    setActiveDropdownIdx(null);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (enrollmentDebounceRef.current) clearTimeout(enrollmentDebounceRef.current);
    };
  }, []);

  // Restore last entered data when navigating back — also re-runs once the async
  // edit-mode fetch (loadMatterForEditAsync) populates step2Data after this mounts
  useEffect(() => {
    if (savedStep2Data) {
      reset(savedStep2Data);
      // Restore the state filter from the saved courtId
      if (savedStep2Data.courtId) {
        const stateId = courts.find((c) => c.id === savedStep2Data.courtId)?.stateId ?? null;
        setSelectedStateId(stateId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedStep2Data]);

  // Re-run state restore once courts load (in case they weren't in store on mount)
  useEffect(() => {
    if (savedStep2Data?.courtId && courts.length > 0 && selectedStateId === null) {
      const stateId = courts.find((c) => c.id === savedStep2Data.courtId)?.stateId ?? null;
      setSelectedStateId(stateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courts]);

  const [clearKey, setClearKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"details" | "advocates" | "parties">("details");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () =>
    new Promise<boolean>((resolve) => {
      if (!matterId) {
        notifyMessage("Complete client intake (step 1) first", "ERROR");
        resolve(false);
        return;
      }
      handleSubmit(
        async (data: MatterCaseFormData) => {
          try {
            setIsSaving(true);
            // Always inject matterId from the Redux store to prevent payload manipulation
            const payload: MatterCaseFormData = { ...data, matterId };
            const response = caseId
              ? await ApiService.getInstance().caseService.updateMatterCase(matterId, caseId, payload)
              : await ApiService.getInstance().caseService.createMatterCase(matterId, payload);

            if (response.hasData) {
              dispatch(setStep2Success({ formData: payload, response: response.data.data }));
              setIsFormEditable(false);
              notifyMessage("The case has been successfully saved", "SUCCESS");
              resolve(true);
            } else {
              notifyMessage("Failed to save the case", "ERROR");
              resolve(false);
            }
          } catch (err) {
            notifyMessage("Failed to save the case", "ERROR");
            console.error("matter-case API failed:", err);
            resolve(false);
          } finally {
            setIsSaving(false);
          }
        },
        (formErrors) => {
          // Jump to the tab holding the first validation error
          if (formErrors.advocates) setActiveTab("advocates");
          else if (formErrors.parties) setActiveTab("parties");
          else setActiveTab("details");
          resolve(false);
        },
      )();
    });

  useImperativeHandle(ref, () => ({
    submit: handleSave,
    clear: () => {
      reset(MatterCaseDefaultValue);
      setClearKey((k) => k + 1);
      setActiveTab("details");
    },
  }));


  return (
    <form onSubmit={(e) => e.preventDefault()}>


      {/* Sub-tab bar + Edit case — always clickable, independent of view/edit mode */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/60">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "details"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-file-text text-sm" />
            Case details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("advocates")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "advocates"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-users text-sm" />
            Advocates
            {advocateFields.length > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                {advocateFields.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("parties")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "parties"
              ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
          >
            <i className="ti ti-users-group text-sm" />
            Parties
            {partyFields.length > 0 && (
              <span className="ml-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                {partyFields.length}
              </span>
            )}
          </button>


        </div>


        {isFormEditable && (
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

        {caseId && (
          <button
            type="button"
            onClick={() => setIsFormEditable(true)}
            disabled={isFormEditable}
            className="flex items-center gap-1.5 rounded-lg border border-brand-400 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-default disabled:opacity-50 dark:border-brand-500/50 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
          >
            <i className="ti ti-pencil text-sm" />
            Edit case
          </button>
        )}
      </div>

      <fieldset disabled={!isFormEditable} className="disabled:opacity-70">
        <div className={isFormEditable ? undefined : "pointer-events-none"}>
          {activeTab === "details" && (
            <>
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Case title / Subject</FieldLabel>
                  <TextInput placeholder="e.g. Mehta vs Prestige Builders Pvt Ltd" {...register("caseTitle")} />
                  {errors.caseTitle && <p className="mt-1 text-xs text-error-500">{errors.caseTitle.message}</p>}
                </div>
                <div>
                  <FieldLabel>Case type</FieldLabel>
                  <SelectInput options={CASE_TYPES} {...register("caseType")} />
                </div>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <FieldLabel>State</FieldLabel>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    value={selectedStateId ?? ""}
                    onChange={(e) => handleStateChange(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Select state…</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>District</FieldLabel>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    disabled={!selectedStateId}
                    {...register("districtID")}
                  >
                    <option value="">{selectedStateId ? "Select district…" : "Select state first"}</option>
                    {filteredDistricts.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Court name</FieldLabel>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    disabled={!selectedStateId}
                    value={watch("courtId") ?? ""}
                    onChange={(e) => handleCourtChange(Number(e.target.value))}
                  >
                    <option value="">{selectedStateId ? "Select court…" : "Select state first"}</option>
                    {filteredCourts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Bench / division</FieldLabel>
                  <TextInput placeholder="e.g. Commercial division" {...register("benchDivision")} />
                </div>
                <div>
                  <FieldLabel>Filing date</FieldLabel>
                  <Controller
                    control={control}
                    name="filingDate"
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
                          id="filingDate-date-picker"
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

              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <FieldLabel>Case number</FieldLabel>
                  <TextInput placeholder="(Assigned by court)" {...register("caseNumber")} />
                </div>
                <div>
                  <FieldLabel>Filing method</FieldLabel>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    {...register("filingMethod")}
                  >
                    {FILING_METHODS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Urgency / priority</FieldLabel>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    {...register("urgency")}
                  >
                    {URGENCY_LEVELS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <FieldLabel>Applicant type</FieldLabel>
                  <Controller
                    control={control}
                    name="applicantType"
                    render={({ field }) => (
                      <select
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">Select…</option>
                        {APPLICANT_TYPES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div>
                  <FieldLabel>Vakkalath</FieldLabel>
                  <TextInput placeholder="Vakkalath reference / number" {...register("vakkalath")} />
                </div>
                <div>
                  <FieldLabel>Party signature</FieldLabel>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    {...register("partySignature")}
                  >
                    <option value="">Not specified</option>
                    {PARTY_SIGNATURE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <FieldLabel>Relief sought</FieldLabel>
                <TextInput placeholder="e.g. Permanent injunction" {...register("reliefSought")} />
              </div>

              <div className="mb-3">
                <FieldLabel>Case summary / facts</FieldLabel>
                <TextAreaInput placeholder="Describe the facts of the case…" {...register("caseSummary")} />
              </div>
            </>
          )}

          {/* Tab: Advocates */}
          {activeTab === "advocates" && (
            <div className="flex flex-col gap-3">
              {advocateFields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <FieldLabel>Advocate name</FieldLabel>
                    {/* Autocomplete — calls GET /api/master/advocate?keyword=... */}
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="Adv. Rohit Sharma"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        value={watch(`advocates.${idx}.advocateName`)}
                        onChange={(e) => handleAdvocateNameChange(idx, e.target.value)}
                        onFocus={() => {
                          setActiveDropdownIdx(idx);
                          dispatch(searchAdvocateMastersAsync(watch(`advocates.${idx}.advocateName`).trim()));
                        }}
                        onBlur={() => setTimeout(() => setActiveDropdownIdx(null), 180)}
                      />
                      {activeDropdownIdx === idx && (
                        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                          {advocateMasterLoading ? (
                            <li className="px-3 py-2 text-sm text-gray-400">Loading…</li>
                          ) : advocateMasterResults.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No advocates found</li>
                          ) : (
                            advocateMasterResults.map((m) => (
                              <li key={m.id}>
                                <button
                                  type="button"
                                  onMouseDown={() => handleSelectMaster(idx, m)}
                                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-brand-50 dark:hover:bg-brand-500/10"
                                >
                                  <span className="text-sm font-medium text-gray-800 dark:text-white">{m.advocateName}</span>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                    {m.enrollmentNo && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                        <i className="ti ti-id-badge text-[10px]" />
                                        {m.enrollmentNo}
                                      </span>
                                    )}
                                    {m.phone && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                        <i className="ti ti-phone text-[10px]" />
                                        {m.phone}
                                      </span>
                                    )}
                                    {m.barCouncil && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                        <i className="ti ti-building text-[10px]" />
                                        {m.barCouncil}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                    {errors.advocates?.[idx]?.advocateName && (
                      <p className="mt-1 text-xs text-error-500">{errors.advocates[idx]?.advocateName?.message}</p>
                    )}
                  </div>
                  <div>
                    <FieldLabel>Role</FieldLabel>
                    <SelectInput options={ADVOCATE_ROLES} {...register(`advocates.${idx}.role` as const)} />
                  </div>
                  <div>
                    <FieldLabel>Enrollment no.</FieldLabel>
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="e.g. MH/123/2020"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        value={watch(`advocates.${idx}.enrollmentNo`)}
                        onChange={(e) => handleEnrollmentNoChange(idx, e.target.value)}
                        onFocus={() => {
                          setActiveEnrollmentDropdownIdx(idx);
                          dispatch(searchAdvocateMastersAsync(watch(`advocates.${idx}.enrollmentNo`).trim()));
                        }}
                        onBlur={() => setTimeout(() => setActiveEnrollmentDropdownIdx(null), 180)}
                      />
                      {activeEnrollmentDropdownIdx === idx && (
                        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                          {advocateMasterLoading ? (
                            <li className="px-3 py-2 text-sm text-gray-400">Loading…</li>
                          ) : advocateMasterResults.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No advocates found</li>
                          ) : (
                            advocateMasterResults.map((m) => (
                              <li key={m.id}>
                                <button
                                  type="button"
                                  onMouseDown={() => handleSelectMaster(idx, m)}
                                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition hover:bg-brand-50 dark:hover:bg-brand-500/10"
                                >
                                  <span className="text-sm font-medium text-gray-800 dark:text-white">{m.advocateName}</span>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                    {m.enrollmentNo && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                        <i className="ti ti-id-badge text-[10px]" />
                                        {m.enrollmentNo}
                                      </span>
                                    )}
                                    {m.phone && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                        <i className="ti ti-phone text-[10px]" />
                                        {m.phone}
                                      </span>
                                    )}
                                    {m.barCouncil && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                        <i className="ti ti-building text-[10px]" />
                                        {m.barCouncil}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <FieldLabel>Phone</FieldLabel>
                      <TextInput {...register(`advocates.${idx}.phone` as const)} />
                    </div>
                    {advocateFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAdvocate(idx)}
                        className="mb-0.5 shrink-0 rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:border-gray-700"
                      >
                        <TrashBinIcon className="text-error-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <AddRowButton
                onClick={() =>
                  appendAdvocate({ id: null, advocateName: "", role: "junior", enrollmentNo: "", phone: "", email: "", sortOrder: advocateFields.length })
                }
              >
                <PlusUserIcon /> Add advocate
              </AddRowButton>
            </div>
          )}

          {/* Tab: Parties */}
          {activeTab === "parties" && (
            <div className="flex flex-col gap-3">
              {partyFields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800 sm:grid-cols-4">
                  <div>
                    <FieldLabel>Role</FieldLabel>
                    <SelectInput options={PARTY_ROLES} {...register(`parties.${idx}.partyRole` as const)} />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Party name</FieldLabel>
                    <TextInput placeholder="e.g. Rajesh Kumar Mehta" {...register(`parties.${idx}.partyName` as const)} />
                    {errors.parties?.[idx]?.partyName && (
                      <p className="mt-1 text-xs text-error-500">{errors.parties[idx]?.partyName?.message}</p>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <FieldLabel>Details</FieldLabel>
                      <TextInput {...register(`parties.${idx}.details` as const)} />
                    </div>
                    {partyFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParty(idx)}
                        className="mb-0.5 shrink-0 rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:border-gray-700"
                      >
                        <TrashBinIcon className="text-error-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <AddRowButton
                onClick={() =>
                  appendParty({ id: null, partyRole: "respondent", partyName: "", contactId: null, details: "", sortOrder: partyFields.length })
                }
              >
                <PlusUserIcon /> Add party
              </AddRowButton>
            </div>
          )}



        </div>
      </fieldset>
    </form>
  );
});
