import { ApiRestService } from "../../common/ApiRestService";
import type { CaseFormData } from "@pages/CaseManager/CaseTypes";
import type {
  DocketEntryFormData,
  MatterCaseFormData,
  MatterDocketFormData,
  MatterTaskFormData,
} from "@pages/CaseManager/CaseTypes";

const BASE_URL = "http://localhost:1007/api";

// ─── Service ──────────────────────────────────────────────────────────────────
// Form types mirror the Java request/response DTOs directly — no mapping needed.
// Endpoints map 1:1 to auth-service's matter/api controllers:
//   MatterController, MatterCaseController, MatterDocketController, MatterTaskController

export class CaseService extends ApiRestService {

  // Session-storage helpers — avoids re-fetching stable master data on every page load
  private fromSession<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private toSession(key: string, data: unknown): void {
    try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* quota exceeded — skip */ }
  }

  // ── Step 1 — Matter / client intake (MatterController) ──────────────────

  async createMatterStep1(data: CaseFormData): Promise<any> {
    return this.post({
      apiName: "case-create-step1",
      baseURL: BASE_URL,
      path: "/matter/client-intake",
      body: data,
      headers: this.toHeaders(),
    });
  }

  async updateMatterStep1(id: number, data: CaseFormData): Promise<any> {
    return this.put({
      apiName: "case-update-step1",
      baseURL: BASE_URL,
      path: `/matter/client-intake/${id}`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async getMatterWorkflow(matterId: number): Promise<any> {
    return this.get({
      apiName: "matter-get-workflow",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/workflow`,
      headers: this.toHeaders(),
    });
  }

  // ── Step 2 — Case (MatterCaseController) ──────────────────────────────────

  async createMatterCase(matterId: number, data: MatterCaseFormData): Promise<any> {
    return this.post({
      apiName: "matter-case-create",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/case`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async updateMatterCase(matterId: number, caseId: number, data: MatterCaseFormData): Promise<any> {
    return this.put({
      apiName: "matter-case-update",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/case/${caseId}`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async listMatterCases(matterId: number): Promise<any> {
    return this.get({
      apiName: "matter-case-list",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/case`,
      headers: this.toHeaders(),
    });
  }

  async getMatterCase(matterId: number, caseId: number): Promise<any> {
    return this.get({
      apiName: "matter-case-get",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/case/${caseId}`,
      headers: this.toHeaders(),
    });
  }

  // ── Step 3 — Docket (MatterDocketController) ─────────────────────────────

  async openDocket(matterId: number, data: MatterDocketFormData): Promise<any> {
    return this.post({
      apiName: "matter-docket-open",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/docket`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async updateDocket(matterId: number, docketId: number, data: MatterDocketFormData): Promise<any> {
    return this.put({
      apiName: "matter-docket-update",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/docket/${docketId}`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async updateDocketStatus(
    matterId: number,
    docketId: number,
    caseId: number,
    status: "open" | "closed",
  ): Promise<any> {
    return this.put({
      apiName: "docket-status-update",
      baseURL: BASE_URL,
      path: `/docket/${docketId}/status`,
      body: { matterId, docketId, caseId, status },
      headers: this.toHeaders(),
    });
  }

  async listDockets(matterId: number): Promise<any> {
    return this.get({
      apiName: "matter-docket-list",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/docket`,
      headers: this.toHeaders(),
    });
  }

  async getDocket(matterId: number, docketId: number): Promise<any> {
    return this.get({
      apiName: "matter-docket-get",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/docket/${docketId}`,
      headers: this.toHeaders(),
    });
  }

  // ── Step 4 — Docket entries (MatterDocketController) ─────────────────────

  async addDocketEntry(matterId: number, docketId: number, data: DocketEntryFormData): Promise<any> {
    return this.post({
      apiName: "matter-docket-entry-add",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/docket/${docketId}/entry`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async updateDocketEntry(
    matterId: number,
    docketId: number,
    entryId: number,
    data: DocketEntryFormData,
  ): Promise<any> {
    return this.put({
      apiName: "matter-docket-entry-update",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/docket/${docketId}/entry/${entryId}`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async listDocketEntries(matterId: number, docketId: number): Promise<any> {
    return this.get({
      apiName: "matter-docket-entry-list",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/docket/${docketId}/entry`,
      headers: this.toHeaders(),
    });
  }

  // ── Step 5 — Tasks (MatterTaskController) ─────────────────────────────────

  async createTask(matterId: number, data: MatterTaskFormData): Promise<any> {
    return this.post({
      apiName: "matter-task-create",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/task`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async updateTask(matterId: number, taskId: number, data: MatterTaskFormData): Promise<any> {
    return this.put({
      apiName: "matter-task-update",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/task/${taskId}`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  async listTasks(matterId: number, isDone?: boolean): Promise<any> {
    return this.get({
      apiName: "matter-task-list",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/task`,
      qs: isDone === undefined ? undefined : { isDone },
      headers: this.toHeaders(),
    });
  }

  async completeTask(matterId: number, taskId: number): Promise<any> {
    return this.post({
      apiName: "matter-task-complete",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/task/${taskId}/complete`,
      headers: this.toHeaders(),
    });
  }

  // ── Step 6 — Dashboard timeline (MatterTaskController) ────────────────────

  async getMatterTimeline(matterId: number): Promise<any> {
    return this.get({
      apiName: "matter-timeline-get",
      baseURL: BASE_URL,
      path: `/matter/${matterId}/timeline`,
      headers: this.toHeaders(),
    });
  }

  // ── Matter by ID (step-1 data for edit) ────────────────────────────────────

  async getMatterStep1(id: number | string): Promise<any> {
    return this.get({
      apiName: "matter-get-step1",
      baseURL: BASE_URL,
      path: `/matter/${id}`,
      headers: this.toHeaders(),
    });
  }


  // ── Matter by ID (step-1 data for edit) ────────────────────────────────────

  async getMatterByMatterKey(matterKey: number | string): Promise<any> {
    return this.get({
      apiName: "matter-get-by-matter-key",
      baseURL: BASE_URL,
      path: `/matter/${matterKey}/mak`,
      headers: this.toHeaders(),
    });
  }

  // ── Location master — states & courts ────────────────────────────────────

  async getStates(): Promise<any> {
    return this.get({
      apiName: "master-states",
      baseURL: BASE_URL,
      path: "/core/master/state",
      headers: this.toHeaders(),
    });
  }

  async getCourts(stateId?: number): Promise<any> {
    if (!stateId) {
      const cached = this.fromSession("vidhila:master:courts");
      if (cached) return cached;
    }
    const result = await this.get({
      apiName: "master-courts",
      baseURL: BASE_URL,
      path: "/core/master/court",
      qs: stateId ? { stateId } : undefined,
      headers: this.toHeaders(),
    });
    if (!stateId) this.toSession("vidhila:master:courts", result);
    return result;
  }

  // ── Advocate master search (autocomplete) ───────────────────────────────

  async searchAdvocateMasters(keyword?: string): Promise<any> {
    return this.get({
      apiName: "advocate-master-search",
      baseURL: BASE_URL,
      path: `/master/advocate`,
      qs: keyword ? { keyword } : undefined,
      headers: this.toHeaders(),
    });
  }

  // ── Tenant users (assigned_to dropdown) ──────────────────────────────────

  async listTenantUsers(): Promise<any> {
    const cached = this.fromSession("vidhila:master:users");
    if (cached) return cached;
    const result = await this.get({
      apiName: "tenant-users-list",
      baseURL: BASE_URL,
      path: `/user`,
      headers: this.toHeaders(),
    });
    this.toSession("vidhila:master:users", result);
    return result;
  }

  // ── Matter list (paginated) ───────────────────────────────────────────────

  async findMatterPage(page: number, size: number, keyword?: string): Promise<any> {
    return this.get({
      apiName: "matter-list-page",
      baseURL: BASE_URL,
      path: `/matter`,
      qs: { page, size, ...(keyword ? { keyword } : {}) },
      headers: this.toHeaders(),
    });
  }
}

