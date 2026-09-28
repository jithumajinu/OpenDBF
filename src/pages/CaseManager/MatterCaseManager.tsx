import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import { useDispatch, useStore } from "react-redux";
import { useAppSelector } from "@appAssets/hooks/useAppDispatch";
import PageMeta from "../../components/common/PageMeta";
import { Badge } from "./steps/_shared";
import type { StepHandle } from "./steps/_shared";
import Step1ClientIntake from "./steps/Step1ClientIntake";
import Step2CreateCase from "./steps/Step2CreateCase";
import Step3OpenDocket from "./steps/Step3OpenDocket";
import Step4DocketEntries from "./steps/Step4DocketEntries";
import Step5Tasks from "./steps/Step5Tasks";
import Step6Documents from "./steps/Step6Documents";
import MatterDashboard from "./steps/MatterDashboard";
import { resetCase, setStep1Success, setStep2Success, loadLocationDataAsync, loadMatterForEditAsync } from "@appAssets/store/caseSlice";
import { canAccessCaseManagerStep, getCaseManagerStepIndexes } from "./CaseTypes";
import { GearIcon, FolderIcon, MoreDotIcon, PlusUserIcon, PlusIcon, PencilIcon, TrashBinIcon, ShootingStarIcon } from "@appAssets/icons";
import Button from "@components/ui/button/Button";

// ─── Steps config ─────────────────────────────────────────────────────────────

interface Step {
  id: string;
  label: string;
}

const STEPS: Step[] = [
  { id: "client", label: "Client intake" },
  { id: "case", label: "Create case" },
  { id: "docket", label: "Open docket" },
  { id: "entries", label: "Docket entries" },
  { id: "tasks", label: "Tasks & deadlines" },
  { id: "documents", label: "Documents" },
  { id: "summary", label: "Case dashboard" },
];

// ─── Step panels ──────────────────────────────────────────────────────────────

const STEP_PANELS = [
  Step1ClientIntake,
  Step2CreateCase,
  Step3OpenDocket,
  Step4DocketEntries,
  Step5Tasks,
  Step6Documents,
  MatterDashboard,
];

const ACTIVITY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  CREATE: { icon: "ti-plus", label: "Created", color: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" },
  TASK_CREATED: { icon: "ti-list-check", label: "Task created", color: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400" },
  UPDATE: { icon: "ti-pencil", label: "Updated", color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" },
  STATUS_CHANGE: { icon: "ti-arrows-exchange", label: "Status changed", color: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" },
  DELETE: { icon: "ti-trash", label: "Deleted", color: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400" },
  NOTE: { icon: "ti-note", label: "Note", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
  COMMENT: { icon: "ti-message", label: "Comment", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
  EMAIL: { icon: "ti-mail", label: "Email", color: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" },
  CALL: { icon: "ti-phone", label: "Call", color: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400" },
  MEETING: { icon: "ti-users", label: "Meeting", color: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400" },
  DOCUMENT: { icon: "ti-file", label: "Document", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
};

const formatActivityDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatActivityTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

const formatActivityDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  const label = date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  return isToday ? `${label} — Today` : label;
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function MatterCaseManager() {
  const { matterKey } = useParams<{ matterKey: string }>();
  const isEditMode = !!matterKey;

  const resumeStep = useAppSelector((s) => s.case.resumeStep);
  const [current, setCurrent] = useState(resumeStep);
  const [panelKey, setPanelKey] = useState(0); // bump to remount active step after test-data inject
  const [devOpen, setDevOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const panelRef = useRef<StepHandle>(null);
  const dispatch = useDispatch();
  const store = useStore();

  // Load states & courts once when CaseManager first mounts
  useEffect(() => {
    dispatch(loadLocationDataAsync() as any);
  }, [dispatch]);

  // Handle create vs edit mode on mount
  useEffect(() => {
    if (!isEditMode) {
      // Create mode — always start fresh
      dispatch(resetCase());
      setCurrent(0);
    } else if (!matterId || step1Response?.matterKey !== matterKey) {
      // Reload when: store empty, page refresh, or navigated to a different matter
      (async () => {
        await dispatch(loadMatterForEditAsync({ matterId: matterKey, editMode: true }) as any);
        // Read resumeStep from the store after the reducer has run (avoids stale closure)
        setCurrent((store.getState() as any).case.resumeStep ?? 0);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterKey]);

  // ── READ from store ────────────────────────────────────────────────────────
  // useAppSelector gives you a typed snapshot of any slice value.
  // The component re-renders automatically whenever the selected value changes.
  const matterId = useAppSelector((s) => s.case.matterId);
  const step1Response = useAppSelector((s) => s.case.step1Response);
  const caseId = useAppSelector((s) => s.case.caseId);
  const docketId = useAppSelector((s) => s.case.docketId);
  const step1Data = useAppSelector((s) => s.case.step1Data);
  const step2Data = useAppSelector((s) => s.case.step2Data);
  const step3Data = useAppSelector((s) => s.case.step3Data);
  const taskCount = useAppSelector((s) => s.case.tasks.length);
  const timelineCount = useAppSelector((s) => s.case.timeline.length);
  const activityLogs = useAppSelector((s) => s.case.activityLogs);
  const docketEntryCount = useAppSelector((s) => s.case.docketEntries.length);
  const selectedMatterType = useAppSelector((s) => s.case.selectedMatterType);
  const visibleStepIndexes = getCaseManagerStepIndexes(selectedMatterType);
  const currentVisibleStep = Math.max(visibleStepIndexes.indexOf(current), 0);

  useEffect(() => {
    if (!canAccessCaseManagerStep(selectedMatterType, current)) {
      setCurrent(visibleStepIndexes[0]);
    }
  }, [current, selectedMatterType, visibleStepIndexes]);

  // ── WRITE / UPDATE specific values in the store ───────────────────────────
  // Pattern: read current state → spread it → override only the changed fields → dispatch.

  /** Patch a single field in step-2 (case) without touching anything else */
  const handlePatchCaseTitle = () => {
    if (!step2Data || !matterId) return;
    dispatch(
      setStep2Success({
        formData: { ...step2Data, caseTitle: `PATCHED — ${Date.now()}` },
        response: { ...(step2Data as any), id: caseId ?? 0 },
      })
    );
    setPanelKey((k) => k + 1); // remount current panel so its useEffect picks up new store data
  };

  /** Fill every step with mock data so you can test all panels without backend */
  const handleFillTestData = () => {
    dispatch(
      setStep1Success({
        formData: {
          id: null,
          matterName: "Demo Matter — Mehta vs Prestige",
          matterType: 1,
          clientType: "Individual",
          referredBy: "Bar Council referral",
          initialMatter: "Property dispute",
          clientContact: {
            id: null, firstName: "Rajesh", lastName: "Mehta", companyName: "",
            jobTitle: "", department: "", email1: "rajesh@example.com", email2: "",
            phone1: "9876543210", phone2: "", website1: "", website2: "",
            panId: "ABCDE1234F", dateOfBirth: null,
            addressList: [{
              street: "12 MG Road", city: "Mumbai", state: "Maharashtra",
              stateCode: "MH", zip: "400001", country: "India", countryCode: "IN",
              region: "", lang: "", other: ""
            }],
          },
        },
        response: {
          id: 9001, matterName: "Demo Matter — Mehta vs Prestige",
          matterType: 1,
          matterKey: "demo-matter-mehta-vs-prestige",
          clientType: "Individual", referredBy: "Bar Council referral",
          initialMatter: "Property dispute", clientContact: 0
        },
      })
    );
    dispatch(
      setStep2Success({
        formData: {
          id: null, matterId: 9001, caseTitle: "Mehta vs Prestige Builders Pvt Ltd",
          caseType: "Civil suit", courtId: null,
          courtName: "Bombay High Court", benchDivision: "Commercial Division", districtID: "14004",
          caseNumber: "COMM/123/2024", filingDate: "2024-03-15",
          filingMethod: "e_filing", applicantType: 1, vakkalath: "", partySignature: "yes", reliefSought: "Permanent injunction",
          urgency: "high", caseSummary: "Property dispute over commercial plot in Mumbai.",
          advocates: [{
            id: null, advocateName: "Adv. Rohit Sharma", role: "lead",
            enrollmentNo: "MH/456/2019", phone: "9898989898", email: "rohit@lawfirm.in", sortOrder: 0
          }],
          parties: [
            { id: null, partyRole: "petitioner", partyName: "Rajesh Mehta", contactId: null, details: "Plaintiff", sortOrder: 0 },
            { id: null, partyRole: "respondent", partyName: "Prestige Builders Pvt Ltd", contactId: null, details: "Defendant", sortOrder: 1 },
          ],
        },
        response: {
          id: 5001, matterId: 9001, caseTitle: "Mehta vs Prestige Builders Pvt Ltd",
          caseType: "Civil suit", courtId: null, courtName: "Bombay High Court",
          benchDivision: "Commercial Division", districtID: "14004", caseNumber: "COMM/123/2024",
          filingDate: "2024-03-15", filingMethod: "e_filing", applicantType: 1, vakkalath: "", partySignature: "yes",
          reliefSought: "Permanent injunction", urgency: "high",
          caseSummary: "Property dispute.", advocates: [], parties: []
        },
      })
    );
    setPanelKey((k) => k + 1); // remount so all steps re-read the new store data
  };

  const progressPct = Math.round(((currentVisibleStep + 1) / visibleStepIndexes.length) * 100);
  const ActivePanel = STEP_PANELS[current];
  const isLast = currentVisibleStep === visibleStepIndexes.length - 1;

  const next = async () => {
    const proceed = async () => {
      const success = await panelRef.current?.submit();
      if (success) {
        const selectedMatterType = (store.getState() as any).case.selectedMatterType;
        const nextVisibleSteps = getCaseManagerStepIndexes(selectedMatterType);
        const nextIndex = nextVisibleSteps.find((index) => index > current);
        setCurrent(nextIndex ?? current);
      }
    };

    if (panelRef.current?.confirmLeave) {
      panelRef.current.confirmLeave(() => void proceed());
    } else {
      await proceed();
    }
  };

  const prev = () => {
    const navigate = () => setCurrent(visibleStepIndexes[Math.max(currentVisibleStep - 1, 0)]);
    if (panelRef.current?.confirmLeave) {
      panelRef.current.confirmLeave(navigate);
    } else {
      navigate();
    }
  }

  const goTo = (idx: number) => {
    if (!canAccessCaseManagerStep(selectedMatterType, idx)) return;

    const navigate = () => setCurrent(idx);
    if (panelRef.current?.confirmLeave) {
      panelRef.current.confirmLeave(navigate);
    } else {
      navigate();
    }
  };

  const handleClear = () => {
    panelRef.current?.clear();
    dispatch(resetCase());
  };

  const quickActions: {
    label: string;
    description: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    onClick?: () => void;
  }[] = [
      {
        label: "Open in Editor",
        description: "Edit and collaborate",
        icon: "ti-pencil",
        iconBg: "bg-blue-50 dark:bg-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400",
        onClick: () => goTo(STEPS.findIndex((step) => step.id === "documents")),
      },
      {
        label: "Save to Cloud",
        description: "Secure your documents",
        icon: "ti-cloud-upload",
        iconBg: "bg-purple-50 dark:bg-purple-500/10",
        iconColor: "text-purple-600 dark:text-purple-400",
        onClick: () => void panelRef.current?.submit(),
      },
      {
        label: "Download PDF",
        description: "Get a copy",
        icon: "ti-download",
        iconBg: "bg-amber-50 dark:bg-amber-500/10",
        iconColor: "text-amber-600 dark:text-amber-400",
      },
      {
        label: "Share Document",
        description: "With team or client",
        icon: "ti-share-3",
        iconBg: "bg-teal-50 dark:bg-teal-500/10",
        iconColor: "text-teal-600 dark:text-teal-400",
      },
    ];

  return (
    <div>
      <PageMeta
        title={isEditMode ? "Edit Matter" : "New Matter"}
        description="Case Manager — step-by-step legal matter workflow"
      />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4 ml-2 mr-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <FolderIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Matters</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your cases, documents, and legal workflows</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="std" variant="primary" className="cust-button rounded-lg px-4 py-2.5"
          // onClick={() => newMatterDrawerOpen(true, null)}
          >
            <PlusIcon />New Matter
          </Button>
          <button
            type="button"
            aria-label="More options"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
          >
            <MoreDotIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
            {/* Steps bar */}
            <div className="flex items-center overflow-x-auto">
              {visibleStepIndexes.map((stepIndex, visibleIndex) => {
                const step = STEPS[stepIndex];
                const isDone = visibleIndex < currentVisibleStep;
                const isActive = visibleIndex === currentVisibleStep;
                return (
                  <div key={step.id} className="flex shrink-0 items-center">
                    <button
                      onClick={() => goTo(stepIndex)}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors focus:outline-none ${isActive ? "bg-brand-50 dark:bg-brand-500/15" : ""
                        }`}
                    >
                      {isDone ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
                          <svg viewBox="0 0 12 10" className="h-2.5 w-2.5" fill="none">
                            <path
                              d="M1 5L4.5 8.5L11 1.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      ) : isActive ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-500 text-white">
                          <i className="ti ti-file-text text-xs" />
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-semibold text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400">
                          {visibleIndex + 1}
                        </span>
                      )}
                      <span
                        className={`whitespace-nowrap text-xs ${isDone
                          ? "font-medium text-gray-700 dark:text-gray-300"
                          : isActive
                            ? "font-semibold text-brand-600 dark:text-brand-400"
                            : "text-gray-500 dark:text-gray-400"
                          }`}
                      >
                        {step.label}
                      </span>
                    </button>
                    {visibleIndex < visibleStepIndexes.length - 1 && (
                      <svg viewBox="0 0 8 14" className="mx-1.5 h-3 w-3 shrink-0 text-gray-300 dark:text-gray-600" fill="none">
                        <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100 dark:bg-gray-800">
              <div
                className="h-1 bg-brand-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Panel */}
            <div className="px-5 py-6 sm:px-8">
              <ActivePanel key={panelKey} ref={panelRef} />
              {/* Navigation */}
              {!isLast && (
                <div className="mt-7 flex justify-end gap-2">
                  {/* {current > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <i className="ti ti-arrow-left text-sm" />
                  Back
                </button>
              )} */}

                  {/* <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-error-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-error-400"
              >
                <i className="ti ti-trash text-sm" />
                Clear
              </button> */}
                  {/* <button
                onClick={next}
                className="flex items-center gap-1.5 rounded-lg border border-brand-400 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/50 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
              >
                {currentVisibleStep === visibleStepIndexes.length - 2 ? "View dashboard" : "Save & continue"}
                <i className="ti ti-arrow-right text-sm" />
              </button> */}
                </div>
              )}

              {(isEditMode || activityLogs.length > 0) && (
                <section className="mt-7 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                  {/* Header */}
                  <button
                    type="button"
                    onClick={() => setActivityOpen((isOpen) => !isOpen)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left focus:outline-none"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                      <i className="ti ti-history text-base" />
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white">Activity Log</span>
                      {activityLogs.length > 0 && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                          {activityLogs.length}
                        </span>
                      )}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                      {activityOpen ? "Hide" : "View all"}
                      <i className={`ti ti-chevron-${activityOpen ? "up" : "right"} text-xs`} />
                    </span>
                  </button>

                  {activityOpen && (
                    <div id="matter-activity-log" className="border-t border-gray-100 px-5 pb-4 pt-1 dark:border-gray-800">
                      {activityLogs.length === 0 ? (
                        <p className="py-6 text-center text-sm text-gray-400">No activity recorded yet.</p>
                      ) : (() => {
                        // group entries by calendar day
                        const groups: { day: string; items: typeof activityLogs }[] = [];
                        activityLogs.forEach((a) => {
                          const day = formatActivityDay(a.createdAt);
                          const last = groups[groups.length - 1];
                          if (last && last.day === day) last.items.push(a);
                          else groups.push({ day, items: [a] });
                        });
                        return (
                          <div className="py-3">
                            {groups.map((group) => (
                              <div key={group.day}>
                                {/* Day header */}
                                <p className="mb-3 mt-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                  {group.day}
                                </p>

                                {/* Timeline entries */}
                                <ul>
                                  {group.items.map((activity, idx) => {
                                    const config = ACTIVITY_CONFIG[activity.activityType] ?? {
                                      icon: "ti-activity",
                                      label: activity.activityType.replace(/_/g, " ").toLowerCase(),
                                      color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
                                    };
                                    const initials = (activity.createdByName ?? "?")[0].toUpperCase();
                                    const isLast = idx === group.items.length - 1;
                                    return (
                                      <li key={activity.noteId} className="flex items-stretch gap-0">
                                        {/* Time column */}
                                        <div className="w-16 shrink-0 pt-1.5 pr-3 text-right">
                                          <span className="text-[11px] leading-tight text-gray-400 dark:text-gray-500">
                                            {formatActivityTime(activity.createdAt)}
                                          </span>
                                        </div>

                                        {/* Icon + vertical connector */}
                                        <div className="flex shrink-0 flex-col items-center">
                                          <span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                                            <i className={`ti ${config.icon} text-sm`} />
                                          </span>
                                          {!isLast && (
                                            <span className="mt-1 w-px flex-1 bg-gray-200 dark:bg-gray-700" />
                                          )}
                                        </div>

                                        {/* Card body */}
                                        <div className={`ml-3 flex-1 ${isLast ? "pb-1" : "pb-4"}`}>
                                          <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                                            {/* User avatar */}
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                              {initials}
                                            </span>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                              <div className="flex flex-wrap items-center gap-x-2">
                                                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                                  {activity.createdByName}
                                                </span>
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium capitalize text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                  {config.label}
                                                </span>
                                              </div>
                                              <p className="mt-0.5 break-words text-sm text-gray-600 dark:text-gray-300">
                                                {activity.noteText}
                                              </p>
                                              <p className="mt-1 text-[11px] capitalize text-gray-400 dark:text-gray-500">
                                                {activity.entityType.replace(/_/g, " ")}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </section>
              )}

              {/* ── Store Dev Panel ───────────────────────────────────────────── */}
              {import.meta.env.DEV && (
                <div className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                  <button
                    type="button"
                    onClick={() => setDevOpen((o) => !o)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-amber-700 dark:text-amber-400"
                  >
                    <i className={`ti ti-${devOpen ? "chevron-down" : "chevron-right"} text-xs`} />
                    Store Dev Panel - Step:{matterId},   and Values: {current}
                    <span className="ml-auto font-normal opacity-60">DEV only — hidden in production</span>
                  </button>

                  {devOpen && (
                    <div className="border-t border-amber-200 px-4 pb-4 pt-3 dark:border-amber-700">

                      {/* ── READ: current store snapshot ── */}
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">READ — current store values</p>
                      <div className="mb-3 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3">
                        {[
                          { label: "matterId", value: matterId },
                          { label: "caseId", value: caseId },
                          { label: "docketId", value: docketId },
                          { label: "matterName", value: step1Data?.matterName },
                          { label: "caseTitle", value: step2Data?.caseTitle },
                          { label: "courtName", value: step2Data?.courtName },
                          { label: "docketType", value: (step3Data as any)?.docketType },
                          { label: "tasks #", value: taskCount },
                          { label: "entries #", value: docketEntryCount },
                          { label: "timeline #", value: timelineCount },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded bg-amber-100 px-2 py-1 dark:bg-amber-800/40">
                            <span className="block text-[10px] text-amber-500 dark:text-amber-400">{label}</span>
                            <span className="font-mono text-amber-900 dark:text-amber-200">
                              {value != null ? String(value) : <span className="opacity-40">null</span>}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* ── WRITE: update specific values ── */}
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">WRITE — update store values</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleFillTestData}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          <i className="ti ti-database-import mr-1 text-xs" />
                          Fill all steps with test data
                        </button>
                        <button
                          type="button"
                          onClick={handlePatchCaseTitle}
                          disabled={!step2Data}
                          className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-40 dark:bg-transparent dark:text-amber-400"
                        >
                          <i className="ti ti-pencil mr-1 text-xs" />
                          Patch caseTitle only
                        </button>
                        <button
                          type="button"
                          onClick={() => { dispatch(resetCase()); setPanelKey((k) => k + 1); }}
                          className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:bg-transparent"
                        >
                          <i className="ti ti-trash mr-1 text-xs" />
                          Reset store
                        </button>
                      </div>

                      {/* ── Pattern cheat-sheet ── */}
                      <details className="mt-3">
                        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500">Pattern cheat-sheet</summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-[10px] leading-relaxed text-green-300">{
                          `// READ any value
const matterId = useAppSelector((s) => s.case.matterId);
const caseTitle = useAppSelector((s) => s.case.step2Data?.caseTitle);

// UPDATE a whole step (replaces formData + response)
dispatch(setStep2Success({ formData: { ...step2Data, caseTitle: 'new' }, response: step2Response }));

// RESET everything
dispatch(resetCase());`
                        }</pre>
                      </details>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((isOpen) => !isOpen)}
            aria-label={sidebarOpen ? "Collapse quick actions panel" : "Expand quick actions panel"}
            className="absolute -left-3 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <GearIcon className="h-6 w-6 shrink-0 items-center justify-center" />
          </button>

          {sidebarOpen && (
            <aside className="w-full shrink-0 lg:w-80">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white">
                  <i className="ti ti-bolt text-brand-500" />
                  Quick actions
                </p>
                <div className="flex flex-col gap-1">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={action.onClick}
                      disabled={!action.onClick}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-gray-50 disabled:cursor-default disabled:opacity-60 dark:hover:bg-white/[0.03]"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                        <i className={`ti ${action.icon} text-base ${action.iconColor}`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-gray-800 dark:text-white">{action.label}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{action.description}</span>
                      </span>
                      {action.onClick && <i className="ti ti-chevron-right text-sm text-gray-300" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                    <i className="ti ti-message-chatbot text-base" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">Need help?</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Ask our AI assistant or check the help center.</p>
                    <button type="button" className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                      Chat with Vidhila AI
                      <i className="ti ti-arrow-right text-xs" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 to-white p-4 dark:border-gray-800 dark:from-brand-500/10 dark:to-gray-900">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Stay organized, work smarter.</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Let Vidhila handle the routine, so you can focus on what matters.</p>
                <div className="mt-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-200 dark:bg-brand-500/30" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-200 dark:bg-brand-500/30" />
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
