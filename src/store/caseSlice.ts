import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  CaseFormData,
  DocketEntryResponse,
  MatterCaseFormData,
  MatterCaseResponse,
  MatterDocketFormData,
  MatterDocketResponse,
  MatterTaskFormData,
  MatterTaskResponse,
  MatterTimelineResponse,
} from "@pages/CaseManager/CaseTypes";
import type { StateItem, CourtItem } from "@pages/CaseManager/constants";
import { STATIC_STATES, STATIC_COURTS } from "@pages/CaseManager/constants";
import { ApiService } from '@apiServices/ApiService'
import type { DocumentTypeItem } from '@apiServices/document/service/DocumentService';
import type { DocumentTemplateSummary } from '@components/document';

export interface MatterDto {
  id: number;
  matterKey: string;
  matterName: string;
  matterType: number;
  clientType: string;
  referredBy: string;
  initialMatter: string;
  clientContact: any;
  cases?: any[];
  dockets?: any[];
  docketEntryList?: any[];
  matterTaskList?: any[];
  activityLogs?: MatterActivityLogItem[];
}

export type MatterActivityType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'NOTE'
  | 'COMMENT'
  | 'STATUS_CHANGE'
  | 'EMAIL'
  | 'CALL'
  | 'MEETING'
  | 'DOCUMENT'
  | 'TASK_CREATED';

export interface MatterActivityLogItem {
  noteId: number;
  matterId: number;
  entityType: string;
  entityId: number;
  activityType: MatterActivityType;
  noteText: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
}

export interface MatterPageResponse {
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  previous: boolean;
  next: boolean;
  totalCount: number;
  content: MatterDto[];
  paginationContent: null;
  pagingArea: boolean;
  hasData: boolean;
}

export interface AdvocateMasterItem {
  id: number;
  advocateName: string;
  enrollmentNo: string;
  phone: string;
  email: string;
  barCouncil: string;
  specialization: string;
  isActive: boolean;
}

export interface TenantUserItem {
  id: number;
  name: string;
  username: string;
  email: string;
}
/** Step 6 — document tracked against the matter */
export interface MatterDocumentItem {
  id: number | null;
  documentName: string;
  documentType: string;
  fileUrl: string;
  /** Template this document was composed from (document_templates.id) — used to reopen the composer for edits. */
  templateId?: number;
  /** Cached composer content (ProseMirror JSON, serialized) so the list reflects the latest saved edits. */
  contentJson?: string;
  /** Cached composer variable definitions/values, kept in sync with the latest saved edits. */
  variables?: Array<{ key: string; label: string; dataSource?: string; value?: string; required?: boolean }>;
}// ─── API response shape for step 1 ───────────────────────────────────────────

export type { StateItem, CourtItem };

const restApi: ApiService = ApiService.getInstance()
export interface MatterStep1Response {
  id: number;
  matterKey: string;
  matterName: string;
  matterType: number;
  clientType: string;
  referredBy: string;
  initialMatter: string;
  clientContact: number;
}

// ─── Slice state ──────────────────────────────────────────────────────────────

interface CaseState {
  /** ID returned by the backend after first POST; used to switch to PUT on re-submit */
  matterId: number | null;
  /** Live intake selection used to control court-only Case Manager steps before saving. */
  selectedMatterType: number;
  /** Last successfully submitted step-1 form data — restored when navigating back */
  step1Data: CaseFormData | null;
  /** Full API response payload from step 1 */
  step1Response: MatterStep1Response | null;

  /** Step 2 — case created under the matter */
  caseId: number | null;
  step2Data: MatterCaseFormData | null;
  step2Response: MatterCaseResponse | null;

  /** Step 3 — docket opened under the case */
  docketId: number | null;
  step3Data: MatterDocketFormData | null;
  step3Response: MatterDocketResponse | null;

  /** All dockets for this matter (from GET /matter/{id}) */
  dockets: any[];

  /** Step 4 — docket entries recorded so far */
  docketEntries: DocketEntryResponse[];

  /** Step 5 — tasks created so far */
  tasks: MatterTaskResponse[];

  /** Matter-scoped data, grouped separately since it belongs to the matter, not this wizard's case/docket steps. */
  matter: {
    /** Step 6 — documents tracked against the matter */
    documents: MatterDocumentItem[];
  };

  /** Master catalog of document templates (name/category/content/variables), used by the Documents step composer. */
  documentTemplates: DocumentTemplateSummary[];
  documentTemplatesLoading: boolean;

  /** Step 7 — case timeline */
  timeline: MatterTimelineResponse[];

  /** Matter create/update/delete audit activity */
  activityLogs: MatterActivityLogItem[];

  /** Matter paginated list */
  matterPageObj: MatterPageResponse;
  loading: boolean;

  /** Advocate master autocomplete */
  advocateMasterResults: AdvocateMasterItem[];
  advocateMasterLoading: boolean;

  /** Location master — Indian states & courts */
  states: StateItem[];
  courts: CourtItem[];
  locationLoading: boolean;

  /** Tenant users — for task assigned_to dropdown */
  tenantUsers: TenantUserItem[];
  tenantUsersLoading: boolean;

  /** Index of the step to open when the manager mounts — set by loadMatterForEditAsync and advanced on each Save. */
  resumeStep: number;
}

const initialState: CaseState = {
  matterId: null,
  selectedMatterType: 1,
  step1Data: null,
  step1Response: null,

  caseId: null,
  step2Data: null,
  step2Response: null,

  docketId: null,
  step3Data: null,
  step3Response: null,

  dockets: [],

  docketEntries: [],

  tasks: [],

  matter: {
    documents: [],
  },

  documentTemplates: [],
  documentTemplatesLoading: false,

  timeline: [],

  activityLogs: [],

  matterPageObj: {
    pageSize: 10,
    pageNumber: 1,
    totalPages: 0,
    previous: false,
    next: false,
    totalCount: 0,
    content: [],
    paginationContent: null,
    pagingArea: false,
    hasData: false,
  },
  loading: false,
  advocateMasterResults: [],
  advocateMasterLoading: false,
  states: STATIC_STATES,
  courts: STATIC_COURTS,
  locationLoading: false,

  tenantUsers: [],
  tenantUsersLoading: false,

  resumeStep: 0,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const searchAdvocateMastersAsync = createAsyncThunk(
  'advocateMaster/search',
  async (keyword: string) => {
    const response = await restApi.caseService.searchAdvocateMasters(keyword || undefined);
    return response?.data?.data as AdvocateMasterItem[];
  }
);

export const loadTenantUsersAsync = createAsyncThunk(
  'tenantUsers/load',
  async () => {
    const response = await restApi.caseService.listTenantUsers();
    return response?.data?.data as TenantUserItem[];
  }
);

/** Fetch states and all courts from the backend.
 *  Falls back to the static data already seeded in initialState if the call fails. */
export const loadLocationDataAsync = createAsyncThunk(
  'location/load',
  async () => {
    const [statesRes, courtsRes] = await Promise.all([
      restApi.caseService.getStates(),
      restApi.caseService.getCourts(),
    ]);
    return {
      states: (statesRes?.data?.data ?? []) as StateItem[],
      courts: (courtsRes?.data?.data ?? []) as CourtItem[],
    };
  }
);

/** Fetch the saved documents for the current matter from the matter document endpoint. */
export const loadDocumentsAsync = createAsyncThunk(
  'documents/load',
  async (matterIdentifier: number | string) => {
    const response = await restApi.documentService.getDocumentTypes(matterIdentifier);
    const payload = response?.data?.data ?? response?.data ?? [];
    const result = Array.isArray(payload) ? payload : payload?.content ?? [];
    return result as DocumentTypeItem[];
  }
);

const parseJsonSafe = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

/** Fetch the master catalog of document templates (name/category/content/variables) used by the Documents step composer. */
export const loadDocumentTemplatesAsync = createAsyncThunk(
  'documentTemplates/load',
  async () => {
    const response = await restApi.documentService.getDocumentTemplates();
    const list = response?.data?.data ?? response?.data ?? [];
    const items = Array.isArray(list) ? list : [];
    return items.map((item: any): DocumentTemplateSummary => ({
      id: item?.id ?? 0,
      name: item?.documentName ?? item?.name ?? 'Untitled template',
      category: item?.category ?? item?.documentType ?? '',
      contentJson: parseJsonSafe(item?.contentJson, item?.contentJson ?? ''),
      variables: parseJsonSafe(item?.contentJsonVariables ?? item?.variables, Array.isArray(item?.variables) ? item.variables : []),
    }));
  }
);

// editMode by default is false, if true then it will fetch matter by matterKey instead of matterId
export const loadMatterForEditAsync = createAsyncThunk(
  'matter/loadForEdit',
  async ({ matterId, editMode = false }: { matterId: number | string; editMode?: boolean }) => {
    let response;
    if (!editMode) {
      response = await restApi.caseService.getMatterStep1(matterId);
    } else {
      response = await restApi.caseService.getMatterByMatterKey(matterId);
    }

    return response?.data?.data as any;
  }
);

/** Map a MatterCaseDto (GET /matter/{id} → data.cases[n]) into the Step 2 form shape. */
function mapCaseToStep2FormData(matterId: number, c: any): MatterCaseFormData {
  const advocates = Array.isArray(c.advocates) ? c.advocates : [];
  const parties = Array.isArray(c.parties) ? c.parties : [];
  return {
    id: c.id ?? null,
    matterId,
    caseTitle: c.caseTitle ?? '',
    caseType: c.caseType ?? 'Civil suit',
    courtId: c.courtId ?? null,
    courtName: c.courtName ?? '',
    benchDivision: c.benchDivision ?? '',
    districtID: String(c.districtID ?? c.district ?? ''),
    caseNumber: c.caseNumber ?? '',
    filingDate: c.filingDate ?? null,
    filingMethod: c.filingMethod ?? 'e_filing',
    applicantType: c.applicantType ?? null,
    vakkalath: c.vakkalath ?? '',
    partySignature: c.partySignature ?? '',
    reliefSought: c.reliefSought ?? '',
    urgency: c.urgency ?? 'normal',
    caseSummary: c.caseSummary ?? '',
    advocates: advocates.length
      ? advocates.map((a: any, idx: number) => ({
        id: a.advocateMaster?.id ?? a.advocateId ?? null,
        advocateName: a.advocateMaster?.advocateName ?? '',
        role: a.role ?? 'lead',
        enrollmentNo: a.advocateMaster?.enrollmentNo ?? '',
        phone: a.advocateMaster?.phone ?? '',
        email: a.advocateMaster?.email ?? '',
        sortOrder: a.sortOrder ?? idx,
      }))
      : [{ id: null, advocateName: '', role: 'lead', enrollmentNo: '', phone: '', email: '', sortOrder: 0 }],
    parties: parties.length
      ? parties.map((p: any, idx: number) => ({
        id: p.id ?? null,
        partyRole: p.partyRole ?? (idx === 0 ? 'petitioner' : 'respondent'),
        partyName: p.partyName ?? '',
        contactId: p.contactId ?? null,
        details: p.details ?? '',
        sortOrder: p.sortOrder ?? idx,
      }))
      : [
        { id: null, partyRole: 'petitioner', partyName: '', contactId: null, details: '', sortOrder: 0 },
        { id: null, partyRole: 'respondent', partyName: '', contactId: null, details: '', sortOrder: 1 },
      ],
  };
}

export const fetchMatterAsync = createAsyncThunk(
  'matter/fetchMatters',
  async (params?: any) => {
    const defaultParams = params || {};
    const page = defaultParams.queryState?.page || 1;
    const size = defaultParams.queryState?.size || 10;
    const keyword = defaultParams.filters?.matterName || undefined;

    const response = await restApi.caseService.findMatterPage(page, size, keyword);
    return response?.data?.data as MatterPageResponse;
  }
)


/** Map a MatterDocketDto (GET /matter/{id} → data.dockets[n]) into the Step 3 form shape. */
function mapDocketToStep3FormData(matterId: number, caseId: number | null, d: any): MatterDocketFormData {
  return {
    id: d.id ?? null,
    matterId,
    caseId: d.caseId ?? caseId,
    docketNumber: d.docketNumber ?? '',
    courtName: d.courtName ?? '',
    bench: d.bench ?? '',
    stage: d.stage ?? 'pleadings',
    openedDate: d.openedDate ?? null,
    nextHearingDate: d.nextHearingDate ?? null,
    notes: d.notes ?? '',
  };
}

const caseSlice = createSlice({
  name: "case",
  initialState,
  reducers: {
    setStep1Success(
      state,
      action: PayloadAction<{ formData: CaseFormData; response: MatterStep1Response }>
    ) {
      state.matterId = action.payload.response.id;
      state.selectedMatterType = action.payload.formData.matterType;
      state.step1Data = action.payload.formData;
      state.step1Response = action.payload.response;
      if (state.resumeStep < 0) state.resumeStep = 0;
    },
    setSelectedMatterType(state, action: PayloadAction<number>) {
      state.selectedMatterType = action.payload;
    },
    setStep2Success(
      state,
      action: PayloadAction<{ formData: MatterCaseFormData; response: MatterCaseResponse }>
    ) {
      state.caseId = action.payload.response.id;
      state.step2Data = action.payload.formData;
      state.step2Response = action.payload.response;
      if (state.resumeStep < 1) state.resumeStep = 1;
    },
    setStep3Success(
      state,
      action: PayloadAction<{ formData: MatterDocketFormData; response: MatterDocketResponse }>
    ) {
      state.docketId = action.payload.response.id;
      state.step3Data = action.payload.formData;
      state.step3Response = action.payload.response;
      if (state.resumeStep < 2) state.resumeStep = 2;
    },
    updateDocketSuccess(state, action: PayloadAction<MatterDocketResponse>) {
      state.dockets = state.dockets.map((docket) =>
        docket.id === action.payload.id ? { ...docket, ...action.payload } : docket
      );
      if (state.docketId === action.payload.id) {
        state.step3Response = action.payload;
      }
    },
    setDocketEntries(state, action: PayloadAction<DocketEntryResponse[]>) {
      state.docketEntries = action.payload;
    },
    addDocketEntrySuccess(state, action: PayloadAction<DocketEntryResponse>) {
      state.docketEntries = [action.payload, ...state.docketEntries];
    },
    updateDocketEntrySuccess(state, action: PayloadAction<DocketEntryResponse>) {
      state.docketEntries = state.docketEntries.map((e) => (e.id === action.payload.id ? action.payload : e));
    },
    setTasks(state, action: PayloadAction<MatterTaskResponse[]>) {
      state.tasks = action.payload;
    },
    addTaskSuccess(state, action: PayloadAction<MatterTaskResponse>) {
      state.tasks = [action.payload, ...state.tasks];
    },
    updateTaskSuccess(state, action: PayloadAction<MatterTaskResponse>) {
      state.tasks = state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t));
    },
    setDocuments(state, action: PayloadAction<MatterDocumentItem[]>) {
      state.matter.documents = action.payload;
    },
    addDocumentSuccess(state, action: PayloadAction<MatterDocumentItem>) {
      state.matter.documents = [action.payload, ...state.matter.documents];
    },
    removeDocumentSuccess(state, action: PayloadAction<number>) {
      state.matter.documents = state.matter.documents.filter((_, idx) => idx !== action.payload);
    },
    setTimeline(state, action: PayloadAction<MatterTimelineResponse[]>) {
      state.timeline = action.payload;
    },
    setActivityLogs(state, action: PayloadAction<MatterActivityLogItem[]>) {
      state.activityLogs = action.payload;
    },
    resetCase(state) {
      state.matterId = null;
      state.selectedMatterType = 1;
      state.step1Data = null;
      state.step1Response = null;
      state.caseId = null;
      state.step2Data = null;
      state.step2Response = null;
      state.docketId = null;
      state.step3Data = null;
      state.step3Response = null;
      state.dockets = [];
      state.docketEntries = [];
      state.tasks = [];
      state.matter.documents = [];
      state.timeline = [];
      state.activityLogs = [];
      state.advocateMasterResults = [];
      state.resumeStep = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatterAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMatterAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.matterPageObj = action.payload;
        }
      })
      .addCase(fetchMatterAsync.rejected, (state) => {
        state.loading = false;
      })
      .addCase(loadMatterForEditAsync.fulfilled, (state, action) => {
        if (!action.payload) return;
        const d = action.payload;
        const contact = d.clientContact ?? {};
        state.matterId = d.id;
        state.selectedMatterType = d.matterType ?? 1;
        state.step1Response = {
          id: d.id,
          matterKey: d.matterKey,
          matterName: d.matterName,
          matterType: d.matterType,
          clientType: d.clientType,
          referredBy: d.referredBy,
          initialMatter: d.initialMatter,
          clientContact: contact.id,
        };
        state.step1Data = {
          id: d.id ?? null,
          matterName: d.matterName ?? '',
          matterType: d.matterType ?? 1,
          clientType: d.clientType ?? 'Individual',
          referredBy: d.referredBy ?? '',
          initialMatter: d.initialMatter ?? '',
          clientContact: {
            id: contact.id ?? null,
            firstName: contact.firstName ?? '',
            lastName: contact.lastName ?? '',
            companyName: contact.companyName ?? '',
            jobTitle: contact.jobTitle ?? '',
            department: contact.department ?? '',
            email1: contact.email1 ?? '',
            email2: contact.email2 ?? '',
            phone1: contact.phone1 ?? '',
            phone2: contact.phone2 ?? '',
            website1: contact.website1 ?? '',
            website2: contact.website2 ?? '',
            panId: contact.panId ?? '',
            dateOfBirth: contact.dateOfBirth ?? null,
            addressList: contact.addressList?.length
              ? contact.addressList.map(({ addressId: _id, ...rest }: any) => rest)
              : [{ street: '', city: '', state: '', stateCode: '', zip: '', country: '', countryCode: '', region: '', lang: '', other: '' }],
          },
        };
        // Restore step 2 (case) data from the matter's cases[] — one case per matter in this flow
        if (Array.isArray(d.cases) && d.cases.length > 0) {
          const firstCase = d.cases[0];
          state.caseId = firstCase.id;
          state.step2Data = mapCaseToStep2FormData(d.id, firstCase);
          state.step2Response = firstCase as MatterCaseResponse;
        } else {
          state.caseId = null;
          state.step2Data = null;
          state.step2Response = null;
        }

        // Restore step 3 (docket) data from the matter's dockets[]
        state.dockets = Array.isArray(d.dockets) ? d.dockets : [];
        if (state.dockets.length > 0) {
          const firstDocket = state.dockets[0];
          state.docketId = firstDocket.id;
          state.step3Data = mapDocketToStep3FormData(d.id, state.caseId, firstDocket);
          state.step3Response = firstDocket as MatterDocketResponse;
        } else {
          state.docketId = null;
          state.step3Data = null;
          state.step3Response = null;
        }

        // Restore step 4 (docket entries) and step 5 (tasks)
        state.docketEntries = Array.isArray(d.docketEntryList) ? d.docketEntryList : [];
        state.tasks = Array.isArray(d.matterTaskList) ? d.matterTaskList : [];
        state.activityLogs = Array.isArray(d.activityLogs) ? d.activityLogs : [];

        // Open at the furthest step that already has saved data
        if (state.tasks.length > 0) state.resumeStep = 4;
        else if (state.docketEntries.length > 0) state.resumeStep = 3;
        else if (state.docketId) state.resumeStep = 2;
        else if (state.caseId) state.resumeStep = 1;
        else state.resumeStep = 0;
      })
      .addCase(searchAdvocateMastersAsync.pending, (state) => {
        state.advocateMasterLoading = true;
      })
      .addCase(searchAdvocateMastersAsync.fulfilled, (state, action) => {
        state.advocateMasterLoading = false;
        state.advocateMasterResults = action.payload ?? [];
      })
      .addCase(searchAdvocateMastersAsync.rejected, (state) => {
        state.advocateMasterLoading = false;
      })
      .addCase(loadLocationDataAsync.pending, (state) => {
        state.locationLoading = true;
      })
      .addCase(loadLocationDataAsync.fulfilled, (state, action) => {
        state.locationLoading = false;
        // Only replace if the API returned data; keep static fallback otherwise
        if (action.payload.states.length > 0) state.states = action.payload.states;
        if (action.payload.courts.length > 0) state.courts = action.payload.courts;
      })
      .addCase(loadLocationDataAsync.rejected, (state) => {
        state.locationLoading = false;
        // Static fallback already set in initialState — no action needed
      })
      .addCase(loadDocumentsAsync.fulfilled, (state, action) => {
        state.matter.documents = action.payload.map((document) => ({
          id: typeof document.docTypeId === 'number' ? document.docTypeId : document.id ?? null,
          documentName: document.docTypeName ?? document.documentName ?? document.name ?? document.value ?? '',
          documentType: document.docTypeCode ?? document.documentType ?? document.code ?? document.name ?? 'Other',
          fileUrl: document.fileUrl ?? document.url ?? '',
          templateId: typeof document.templateId === 'number' ? document.templateId : undefined,
        }));
      })
      .addCase(loadDocumentTemplatesAsync.pending, (state) => {
        state.documentTemplatesLoading = true;
      })
      .addCase(loadDocumentTemplatesAsync.fulfilled, (state, action) => {
        state.documentTemplatesLoading = false;
        if (action.payload.length > 0) state.documentTemplates = action.payload;
      })
      .addCase(loadDocumentTemplatesAsync.rejected, (state) => {
        state.documentTemplatesLoading = false;
      })
      .addCase(loadTenantUsersAsync.pending, (state) => {
        state.tenantUsersLoading = true;
      })
      .addCase(loadTenantUsersAsync.fulfilled, (state, action) => {
        state.tenantUsersLoading = false;
        state.tenantUsers = action.payload ?? [];
      })
      .addCase(loadTenantUsersAsync.rejected, (state) => {
        state.tenantUsersLoading = false;
      });
  },
});

export const {
  setStep1Success,
  setSelectedMatterType,
  setStep2Success,
  setStep3Success,
  updateDocketSuccess,
  setDocketEntries,
  addDocketEntrySuccess,
  updateDocketEntrySuccess,
  setTasks,
  addTaskSuccess,
  updateTaskSuccess,
  setDocuments,
  addDocumentSuccess,
  removeDocumentSuccess,
  setTimeline,
  setActivityLogs,
  resetCase,
} = caseSlice.actions;
export default caseSlice.reducer;

