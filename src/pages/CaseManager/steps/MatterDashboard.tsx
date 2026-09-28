import { useEffect, forwardRef, useImperativeHandle } from "react";
import { Badge, Card, KVRow, SectionLabel, type StepHandle } from "./_shared";
import { useAppDispatch, useAppSelector } from "@appAssets/hooks/useAppDispatch";
import { ApiService } from "@apiServices/ApiService";
import { setTimeline } from "@appAssets/store/caseSlice";

const DOT_CLASSES: Record<string, string> = {
  purple: "bg-brand-500",
  teal:   "bg-teal-500",
  amber:  "bg-amber-500",
  red:    "bg-error-500",
  gray:   "bg-gray-400",
  green:  "bg-success-500",
  blue:   "bg-blue-500",
};

// pill background + text driven by badgeColor from the API response
const TAG_CLASSES: Record<string, string> = {
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  teal:   "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  amber:  "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  red:    "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  gray:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  green:  "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  blue:   "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

// icon circle color (softer fill) driven by badgeColor
const ICON_BG_CLASSES: Record<string, string> = {
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  teal:   "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
  amber:  "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  red:    "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
  gray:   "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  green:  "bg-success-50 text-success-600 dark:bg-success-500/20 dark:text-success-400",
  blue:   "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
};

const EVENTTYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  intake:        { icon: "ti-user-check",     label: "Intake" },
  case_created:  { icon: "ti-briefcase",      label: "Case created" },
  case_updated:  { icon: "ti-edit",           label: "Case updated" },
  docket_opened: { icon: "ti-gavel",          label: "Docket opened" },
  filing:        { icon: "ti-upload",         label: "Filing" },
  hearing:       { icon: "ti-calendar-event", label: "Hearing" },
  order:         { icon: "ti-file-check",     label: "Order" },
  notice:        { icon: "ti-bell",           label: "Notice" },
  judgment:      { icon: "ti-scale",          label: "Judgment" },
  task_added:    { icon: "ti-circle-plus",    label: "Task added" },
  task_done:     { icon: "ti-circle-check",   label: "Task done" },
  closed:        { icon: "ti-lock",           label: "Closed" },
};

export default forwardRef<StepHandle>(function MatterDashboard(_, ref) {
  useImperativeHandle(ref, () => ({ submit: () => Promise.resolve(true), clear: () => {} }));

  const dispatch = useAppDispatch();
  const matterId = useAppSelector((s) => s.case.matterId);
  const step1Data = useAppSelector((s) => s.case.step1Data);
  const step2Data = useAppSelector((s) => s.case.step2Data);
  const step3Data = useAppSelector((s) => s.case.step3Data);
  const tasks = useAppSelector((s) => s.case.tasks);
  const timeline = useAppSelector((s) => s.case.timeline);

  useEffect(() => {
    (async () => {
      if (!matterId) return;
      try {
        const response = await ApiService.getInstance().caseService.getMatterTimeline(matterId);
        if (response.data?.hasData) {
          dispatch(setTimeline(response.data.data));
        }
      } catch (err) {
        console.error("matter-timeline API failed:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterId]);

  const activeTasks = tasks.filter((t) => t.status !== "completed").length;
  const leadAdvocate = step2Data?.advocates?.find((a) => a.role === "lead") ?? step2Data?.advocates?.[0];
  const petitioner = step2Data?.parties?.find((p) => p.partyRole === "petitioner");
  const respondent = step2Data?.parties?.find((p) => p.partyRole === "respondent");

  return (
    <>
      {/* <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
        <i className="ti ti-layout-dashboard text-brand-500" />
        Step 6 — Case dashboard
      </h3>
      <p className="mb-5 text-sm text-gray-500">
        Your case is live in the CRM. Here's the full snapshot for {step2Data?.caseTitle || step1Data?.matterName || "this matter"}.
      </p> */}

      {/* Metrics */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { value: matterId ? `M-${matterId}` : "—", label: "Matter ID", color: "text-brand-500" },
          { value: String(activeTasks), label: "Tasks active", color: "text-success-600" },
          { value: step3Data?.nextHearingDate || "—", label: "Next hearing", color: "text-warning-600" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-gray-50 px-3 py-4 text-center dark:bg-gray-800">
            <div className={`text-xl font-semibold ${m.color}`}>{m.value}</div>
            <div className="mt-1 text-xs text-gray-500">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Case record */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <i className="ti ti-id-badge text-base" />
            Case record
          </span>
          <Badge color="purple">{step2Data?.caseType || "—"}</Badge>
        </div>
        <KVRow label="Client" value={petitioner?.partyName || `${step1Data?.clientContact.firstName ?? ""} ${step1Data?.clientContact.lastName ?? ""}`.trim() || "—"} />
        <KVRow label="Opponent" value={respondent?.partyName || "—"} />
        <KVRow label="Court" value={[step2Data?.courtName, step2Data?.benchDivision].filter(Boolean).join(" — ") || "—"} />
        <KVRow label="Lead counsel" value={leadAdvocate?.advocateName || "—"} />
        <KVRow label="Filed on" value={step2Data?.filingDate || "—"} />
        <KVRow label="Stage" value={step3Data?.stage || "—"} />
      </Card>

      <SectionLabel>Case timeline</SectionLabel>
      <div className="mb-4">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 py-10 text-center dark:border-gray-800">
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <i className="ti ti-timeline text-xl text-gray-400" />
            </span>
            <p className="text-sm text-gray-400">No timeline events yet.</p>
          </div>
        ) : (
          <ul className="relative border-l-2 border-gray-100 pl-6 dark:border-gray-800">
            {timeline.map((ev) => {
              const cfg = EVENTTYPE_CONFIG[ev.eventType] ?? { icon: "ti-point", label: ev.eventType };
              const dotCls = DOT_CLASSES[ev.badgeColor] ?? "bg-gray-400";
              const tagCls = TAG_CLASSES[ev.badgeColor] ?? "bg-gray-100 text-gray-600";
              const iconBgCls = ICON_BG_CLASSES[ev.badgeColor] ?? "bg-gray-100 text-gray-500";
              const formattedDate = (() => {
                try {
                  return new Date(ev.eventDate).toLocaleString(undefined, {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  });
                } catch {
                  return ev.eventDate;
                }
              })();
              return (
                <li key={ev.id} className="relative mb-5 last:mb-0">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[1.45rem] top-2.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${dotCls}`} />

                  <div className="flex items-start gap-3">
                    {/* Icon circle */}
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBgCls}`}>
                      <i className={`ti ${cfg.icon} text-sm`} />
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {/* Event type color tag */}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tagCls}`}>
                          {cfg.label}
                        </span>
                        {ev.referenceType && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {ev.referenceType.replace("_", " ")}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">{formattedDate}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{ev.title}</p>
                      {ev.description && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{ev.description}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* AI Assist buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-left text-sm font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20">
          <span className="flex items-center gap-2">
            <i className="ti ti-sparkles text-base" />
            Prepare for next hearing ↗
          </span>
          <span className="mt-0.5 block text-xs font-normal text-brand-500 dark:text-brand-400">
            Ask AI to outline tasks for the next hearing date
          </span>
        </button>
        <button className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <span className="flex items-center gap-2">
            <i className="ti ti-file-description text-base" />
            What documents are needed? ↗
          </span>
          <span className="mt-0.5 block text-xs font-normal text-gray-500">
            Ask AI for the applicable filing checklist
          </span>
        </button>
      </div>
    </>
  );
});
