import { useState, forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { PlusIcon } from "@appAssets/icons";

// ─── Step panel handle (used by NewCaseManager to trigger form submit) ────────

export interface StepHandle {
  /** Returns true if the step is valid and navigation should advance. */
  submit: () => Promise<boolean>;
  /** Resets all local form state for this step. */
  clear: () => void;
  /** Runs `action` immediately, or prompts an unsaved-changes confirmation first when the step has dirty edits. */
  confirmLeave?: (action: () => void) => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocketEntry {
  no: string;
  type: string;
  badgeColor: string;
  date: string;
  title: string;
  meta: string;
}

export interface Task {
  name: string;
  due: string;
  priority: string;
  priorityLabel: string;
  done: boolean;
  subs: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DOCKET_ENTRIES: DocketEntry[] = [
  {
    no: "#001",
    type: "Filing",
    badgeColor: "purple",
    date: "19 May 2025",
    title: "Plaint + injunction application filed",
    meta: "Filed via e-portal. SLP No. awaited. Court fee ₹5,200 paid.",
  },
  {
    no: "#002",
    type: "Order",
    badgeColor: "teal",
    date: "20 May 2025",
    title: "Court admits case & issues notice to respondents",
    meta: "Order by Hon'ble Justice A.K. Menon. Next date: 10-Jun-2025 for respondent's reply.",
  },
  {
    no: "#003",
    type: "Notice",
    badgeColor: "amber",
    date: "21 May 2025",
    title: "Bailiff notice dispatched to M/s Prestige Builders",
    meta: "Notice sent by registered post + e-service. Ack. pending.",
  },
];

export const TASKS: Task[] = [
  {
    name: "Prepare injunction application bundle",
    due: "Due 24 May 2025",
    priority: "error",
    priorityLabel: "Urgent",
    done: true,
    subs: [
      "Draft affidavit in support",
      "Attach sale deed + payment receipts",
      "Prepare index of annexures",
      "Get notarized copies",
    ],
  },
  {
    name: "Serve notice on all respondents",
    due: "Due 27 May 2025",
    priority: "amber",
    priorityLabel: "High",
    done: false,
    subs: [
      "Confirm bailiff service",
      "Send registered post copy",
      "Confirm e-service on HC portal",
    ],
  },
  {
    name: "Draft written statement anticipation note",
    due: "Due 03 Jun 2025",
    priority: "light",
    priorityLabel: "Normal",
    done: false,
    subs: [
      "Research opposing title claim",
      "Identify key precedents",
      "Draft rebuttal outline",
    ],
  },
  {
    name: "Hearing preparation — 10 Jun 2025",
    due: "Due 08 Jun 2025",
    priority: "primary",
    priorityLabel: "Upcoming",
    done: false,
    subs: [
      "Prepare arguments outline",
      "Brief senior counsel",
      "Compile case law bundle",
      "Verify client attendance",
    ],
  },
];

export const FILED_DOCS = [
  "Plaint / Writ petition (signed)",
  "Vakalatnama (Power of attorney)",
  "List of dates and events",
  "Index of documents",
  "Court fees receipt",
];

export const TIMELINE_EVENTS = [
  { color: "purple", date: "19 May 2025", text: "Client intake & conflict check completed" },
  { color: "purple", date: "19 May 2025", text: "Case created — civil suit, injunction relief" },
  { color: "teal",   date: "20 May 2025", text: "Docket opened — e-Filed on HC portal" },
  { color: "teal",   date: "20 May 2025", text: "Court admits case, notice issued to respondents" },
  { color: "amber",  date: "21 May 2025", text: "Bailiff notice dispatched — ack. pending" },
  { color: "amber",  date: "10 Jun 2025", text: "Next hearing — respondents' reply expected", muted: true },
];

// ─── Shared CSS ───────────────────────────────────────────────────────────────

export const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

// ─── Shared helper components ─────────────────────────────────────────────────

/** Right-aligned dashed add button with a brand-colored icon — reuse across all steps. */
export function AddRowButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-600 hover:border-brand-400 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-500/10"
      >
        <PlusIcon className="h-3.5 w-3.5 text-brand-500" />
        {children}
      </button>
    </div>
  );
}

// ─── Shared helper components ─────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </p>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
      {children}
    </label>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  { value?: string; type?: string; placeholder?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "value">
>(function TextInput({ value, type = "text", placeholder, ...rest }, ref) {
  const [val, setVal] = useState(value ?? "");

  if (ref || rest.name) {
    // Controlled by react-hook-form (register spread)
    return (
      <input ref={ref} type={type} className={inputCls} placeholder={placeholder} {...rest} />
    );
  }

  return (
    <input
      type={type}
      className={inputCls}
      value={val}
      placeholder={placeholder}
      onChange={(e) => setVal(e.target.value)}
    />
  );
});

export interface SelectOption {
  value: string;
  label: string;
}

/** Normalizes a plain string into a { value, label } pair so callers can pass either shape. */
function toSelectOption(option: string | SelectOption): SelectOption {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export const SelectInput = forwardRef<
  HTMLSelectElement,
  { options: (string | SelectOption)[]; defaultIndex?: number } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "defaultValue">
>(function SelectInput({ options, defaultIndex = 0, ...rest }, ref) {
  const normalizedOptions = options.map(toSelectOption);
  const [val, setVal] = useState(normalizedOptions[defaultIndex]?.value);

  if (ref || rest.name) {
    // Controlled by react-hook-form (register spread)
    return (
      <select ref={ref} className={inputCls} {...rest}>
        {normalizedOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  return (
    <select className={inputCls} value={val} onChange={(e) => setVal(e.target.value)}>
      {normalizedOptions.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
});

export const TextAreaInput = forwardRef<
  HTMLTextAreaElement,
  { value?: string; placeholder?: string } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value">
>(function TextAreaInput({ value, placeholder, ...rest }, ref) {
  const [val, setVal] = useState(value ?? "");

  if (ref || rest.name) {
    // Controlled by react-hook-form (register spread)
    return (
      <textarea ref={ref} className={`${inputCls} h-20 resize-none`} placeholder={placeholder} {...rest} />
    );
  }

  return (
    <textarea
      className={`${inputCls} h-20 resize-none`}
      value={val}
      placeholder={placeholder}
      onChange={(e) => setVal(e.target.value)}
    />
  );
});

export type BadgeColor = "purple" | "teal" | "amber" | "error" | "primary" | "light" | "gray";

export function Badge({
  color,
  children,
}: {
  color: BadgeColor;
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    purple:  "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    teal:    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
    amber:   "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
    error:   "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
    primary: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    light:   "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-white/70",
    gray:    "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-white/70",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color] ?? map.gray}`}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function AlertInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
      <i className="ti ti-info-circle mt-px shrink-0 text-base" />
      <span>{children}</span>
    </div>
  );
}

export function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-gray-100 py-1.5 last:border-0 dark:border-gray-800">
      <span className="w-40 shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{value}</span>
    </div>
  );
}
