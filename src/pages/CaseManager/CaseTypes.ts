import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AddressEntry = {
  street: string;
  city: string;
  state: string;
  stateCode: string;
  zip: string;
  country: string;
  countryCode: string;
  region: string;
  lang: string;
  other: string;
};

/** Mirrors Java CreateContactRequest */
export type ClientContactFormData = {
  id: number | null;
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string;
  department: string;
  email1: string;
  email2: string;
  phone1: string;
  phone2: string;
  website1: string;
  website2: string;
  panId: string;
  dateOfBirth: string | null;
  addressList: AddressEntry[];
};

/** Mirrors Java ClientIntakeRequest */
export type CaseFormData = {
  id: number | null;
  matterName: string;
  matterType: number;
  clientType: string;
  referredBy: string;
  initialMatter: string;
  clientContact: ClientContactFormData;
};

export const MATTER_TYPES = [
  { value: 1, label: "Litigation" },
  { value: 2, label: "Family law" },
  { value: 3, label: "Criminal" },
  { value: 4, label: "Corporate" },
  { value: 5, label: "Employment" },
  { value: 6, label: "Immigration" },
  { value: 7, label: "Intellectual property" },
  { value: 8, label: "Real estate" },
  { value: 9, label: "Tax" },
  { value: 10, label: "Estate planning" },
  { value: 11, label: "Compliance" },
  { value: 12, label: "Other" },
] as const;

export const COURT_MATTER_TYPES = new Set<number>([1, 2, 3, 5, 8, 9]);

const CASE_MANAGER_STEP_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const;
const NON_COURT_CASE_MANAGER_STEP_INDEXES = [0, 4, 5, 6] as const;
const COURT_ONLY_CASE_MANAGER_STEP_INDEXES = new Set<number>([1, 2, 3]);

export function getCaseManagerStepIndexes(matterType?: number): readonly number[] {
  return COURT_MATTER_TYPES.has(matterType ?? 1)
    ? CASE_MANAGER_STEP_INDEXES
    : NON_COURT_CASE_MANAGER_STEP_INDEXES;
}

export function canAccessCaseManagerStep(matterType: number | undefined, stepIndex: number): boolean {
  return !COURT_ONLY_CASE_MANAGER_STEP_INDEXES.has(stepIndex) || COURT_MATTER_TYPES.has(matterType ?? 1);
}

// ─── Default values ───────────────────────────────────────────────────────────

const defaultAddress: AddressEntry = {
  street: "", city: "", state: "", stateCode: "",
  zip: "", country: "", countryCode: "", region: "", lang: "", other: "",
};

const defaultClientContact: ClientContactFormData = {
  id: null,
  firstName: "",
  lastName: "",
  companyName: "",
  jobTitle: "",
  department: "",
  email1: "",
  email2: "",
  phone1: "",
  phone2: "",
  website1: "",
  website2: "",
  panId: "",
  dateOfBirth: null,
  addressList: [{ ...defaultAddress }],
};

export const NewCaseSchemaDefaultValue: CaseFormData = {
  id: null,
  matterName: "",
  matterType: 1,
  clientType: "Individual",
  referredBy: "",
  initialMatter: "",
  clientContact: { ...defaultClientContact },
};

// ─── Zod schema ───────────────────────────────────────────────────────────────

const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  stateCode: z.string(),
  zip: z.string(),
  country: z.string(),
  countryCode: z.string(),
  region: z.string(),
  lang: z.string(),
  other: z.string(),
});

const ClientContactSchema = z.object({
  id: z.number().nullable().optional(),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  companyName: z.string(),
  jobTitle: z.string(),
  department: z.string(),
  email1: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email address" }),
  email2: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  phone1: z.string().min(1, { message: "Phone is required" }),
  phone2: z.string(),
  website1: z.string(),
  website2: z.string(),
  panId: z.string(),
  dateOfBirth: z.string()
    .nullable()
    .optional()
    .refine((val) => !val || /^\d{2}\/\d{2}\/\d{4}$/.test(val), {
      message: "Date must be in dd/MM/yyyy format",
    }),
  addressList: z.array(AddressSchema),
});

export const CaseObjectSchema = z.object({
  id: z.number().nullable().optional(),
  matterName: z.string().min(1, { message: "Matter name is required" }),
  matterType: z.number().int().min(1).max(12),
  clientType: z.string().min(1, { message: "Client type is required" }),
  referredBy: z.string(),
  initialMatter: z.string(),
  clientContact: ClientContactSchema,
});

// ═══════════════════════════════════════════════════════════════════════════
// Step 2 — Create Case  (mirrors Java MatterCaseRequest / MatterCaseDto)
// ═══════════════════════════════════════════════════════════════════════════

export type MatterAdvocateFormData = {
  id: number | null;
  advocateName: string;
  role: string;
  enrollmentNo: string;
  phone: string;
  email: string;
  sortOrder: number;
};

export type MatterPartyFormData = {
  id: number | null;
  partyRole: string;
  partyName: string;
  contactId: number | null;
  details: string;
  sortOrder: number;
};

/** Mirrors Java MatterCaseRequest */
export type MatterCaseFormData = {
  id: number | null;
  matterId: number | null;
  caseTitle: string;
  caseType: string;
  courtId: number | null;
  courtName: string;
  benchDivision: string;
  districtID: string;
  caseNumber: string;
  filingDate: string | null;
  filingMethod: string;
  /** 1 = Advocate, 2 = Person */
  applicantType: number | null;
  vakkalath: string;
  /** "yes" | "no" | "" — not required */
  partySignature: string;
  reliefSought: string;
  urgency: string;
  caseSummary: string;
  advocates: MatterAdvocateFormData[];
  parties: MatterPartyFormData[];
};

/** Mirrors Java MatterCaseDto */
export type MatterCaseResponse = MatterCaseFormData & { status?: string };

const defaultAdvocate: MatterAdvocateFormData = {
  id: null,
  advocateName: "",
  role: "lead",
  enrollmentNo: "",
  phone: "",
  email: "",
  sortOrder: 0,
};

const defaultParty: MatterPartyFormData = {
  id: null,
  partyRole: "petitioner",
  partyName: "",
  contactId: null,
  details: "",
  sortOrder: 0,
};

export const MatterCaseDefaultValue: MatterCaseFormData = {
  id: null,
  matterId: null,
  caseTitle: "",
  caseType: "Civil suit",
  courtId: null,
  courtName: "",
  benchDivision: "",
  districtID: "",
  caseNumber: "",
  filingDate: null,
  filingMethod: "e_filing",
  applicantType: null,
  vakkalath: "",
  partySignature: "",
  reliefSought: "",
  urgency: "normal",
  caseSummary: "",
  advocates: [{ ...defaultAdvocate }],
  parties: [{ ...defaultParty, partyRole: "petitioner" }, { ...defaultParty, partyRole: "respondent" }],
};

const MatterAdvocateSchema = z.object({
  id: z.number().nullable().optional(),
  advocateName: z.string().min(1, { message: "Advocate name is required" }),
  role: z.string().min(1, { message: "Role is required" }),
  enrollmentNo: z.string(),
  phone: z.string(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  sortOrder: z.number().optional(),
});

const MatterPartySchema = z.object({
  id: z.number().nullable().optional(),
  partyRole: z.string().min(1, { message: "Party role is required" }),
  partyName: z.string().min(1, { message: "Party name is required" }),
  contactId: z.number().nullable().optional(),
  details: z.string(),
  sortOrder: z.number().optional(),
});

export const MatterCaseSchema = z.object({
  id: z.number().nullable().optional(),
  matterId: z.number().nullable().optional(),
  caseTitle: z.string().min(1, { message: "Case title is required" }),
  caseType: z.string(),
  courtId: z.number().nullable().optional(),
  courtName: z.string(),
  benchDivision: z.string(),
  districtID: z.string(),
  caseNumber: z.string(),
  filingDate: z.string().nullable().optional(),
  filingMethod: z.string(),
  applicantType: z.number().nullable().optional(),
  vakkalath: z.string(),
  partySignature: z.string().optional(),
  reliefSought: z.string(),
  urgency: z.string(),
  caseSummary: z.string(),
  advocates: z.array(MatterAdvocateSchema),
  parties: z.array(MatterPartySchema),
});

// ═══════════════════════════════════════════════════════════════════════════
// Step 3 — Open Docket  (mirrors Java MatterDocketRequest / MatterDocketDto)
// ═══════════════════════════════════════════════════════════════════════════

/** Mirrors Java MatterDocketRequest */
export type MatterDocketFormData = {
  id: number | null;
  matterId: number | null;
  caseId: number | null;
  docketNumber: string;
  courtName: string;
  bench: string;
  stage: string;
  openedDate: string | null;
  nextHearingDate: string | null;
  notes: string;
};

/** Mirrors Java MatterDocketDto */
export type MatterDocketResponse = MatterDocketFormData & { status?: string; closedDate?: string | null };

export const MatterDocketDefaultValue: MatterDocketFormData = {
  id: null,
  matterId: null,
  caseId: null,
  docketNumber: "",
  courtName: "",
  bench: "",
  stage: "pleadings",
  openedDate: null,
  nextHearingDate: null,
  notes: "",
};

export const MatterDocketSchema = z.object({
  id: z.number().nullable().optional(),
  matterId: z.number().nullable().optional(),
  caseId: z.number().nullable().optional(),
  docketNumber: z.string(),
  courtName: z.string(),
  bench: z.string(),
  stage: z.string(),
  openedDate: z.string().nullable().optional(),
  nextHearingDate: z.string().nullable().optional(),
  notes: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// Step 4 — Docket Entry  (mirrors Java DocketEntryRequest / DocketEntryDto)
// ═══════════════════════════════════════════════════════════════════════════

/** Mirrors Java DocketEntryRequest */
export type DocketEntryFormData = {
  id: number | null;
  docketId: number | null;
  entryNo: string;
  entryType: string;
  entryDate: string;
  title: string;
  description: string;
  nextDate: string | null;
  reminderDays: number | null;
  hearingOutcome: string;
};

/** Mirrors Java DocketEntryDto */
export type DocketEntryResponse = DocketEntryFormData;

export const DocketEntryDefaultValue: DocketEntryFormData = {
  id: null,
  docketId: null,
  entryNo: "",
  entryType: "filing",
  entryDate: new Date().toISOString().slice(0, 10),
  title: "",
  description: "",
  nextDate: null,
  reminderDays: 3,
  hearingOutcome: "",
};

export const DocketEntrySchema = z.object({
  id: z.number().nullable().optional(),
  docketId: z.number().nullable().optional(),
  entryNo: z.string(),
  entryType: z.string(),
  entryDate: z.string().min(1, { message: "Entry date is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string(),
  nextDate: z.string().nullable().optional(),
  reminderDays: z.number().nullable().optional(),
  hearingOutcome: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// Step 5 — Tasks & Deadlines  (mirrors Java MatterTaskRequest / MatterTaskDto)
// ═══════════════════════════════════════════════════════════════════════════

/** Mirrors Java MatterTaskRequest — subTasks are just nested tasks (parentTaskId set server-side). */
export type MatterTaskFormData = {
  id: number | null;
  parentTaskId: number | null;
  matterId: number | null;
  caseId: number | null;
  docketId: number | null;
  docketEntryId: number | null;
  taskName: string;
  taskDetails: string;
  startDate: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  category: string;
  assignedTo: number | null;
  subTasks: MatterTaskFormData[];
};

/** Mirrors Java MatterTaskDto */
export type MatterTaskResponse = MatterTaskFormData & {
  completedAt?: string | null;
  subTasks: MatterTaskResponse[];
};

export const MatterTaskDefaultValue: MatterTaskFormData = {
  id: null,
  parentTaskId: null,
  matterId: null,
  caseId: null,
  docketId: null,
  docketEntryId: null,
  taskName: "",
  taskDetails: "",
  startDate: null,
  dueDate: null,
  priority: "normal",
  status: "pending",
  category: "",
  assignedTo: null,
  subTasks: [],
};

const MatterTaskShape = {
  id: z.number().nullable().optional(),
  parentTaskId: z.number().nullable().optional(),
  matterId: z.number().nullable().optional(),
  caseId: z.number().nullable().optional(),
  docketId: z.number().nullable().optional(),
  docketEntryId: z.number().nullable().optional(),
  taskName: z.string().min(1, { message: "Task name is required" }),
  taskDetails: z.string(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.string(),
  status: z.string(),
  category: z.string(),
  assignedTo: z.number().nullable().optional(),
};

export const MatterTaskSchema: z.ZodType<MatterTaskFormData> = z.lazy(() =>
  z.object({
    ...MatterTaskShape,
    subTasks: z.array(MatterTaskSchema),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════
// Step 6 — Case Dashboard  (mirrors Java MatterTimelineDto)
// ═══════════════════════════════════════════════════════════════════════════

/** Mirrors Java MatterTimelineDto */
export type MatterTimelineResponse = {
  id: number;
  matterId: number;
  eventType: string;
  eventDate: string;
  title: string;
  description: string;
  badgeColor: string;
  referenceId: number | null;
  referenceType: string;
};

