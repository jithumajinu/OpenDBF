import { ApiRestService } from "../../common/ApiRestService";

export interface DocumentTypeItem {
  id?: number;
  docTypeId?: number;
  docTypeCode?: string;
  docTypeName?: string;
  documentName?: string;
  documentType?: string;
  name?: string;
  value?: string;
  code?: string;
  uploadedDate?: string | null;
  fileUrl?: string;
  url?: string;
  notes?: string;
  contentJson?: string;
  templateId?: number;
  [key: string]: unknown;
}

export interface DocumentTypePageResponse {
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  previous: boolean;
  next: boolean;
  totalCount: number;
  content: DocumentTypeItem[];
  paginationContent: unknown;
  pagingArea: boolean;
  hasData: boolean;
}

export class DocumentService extends ApiRestService {
  async getDocumentTypes(matterIdentifier: number | string): Promise<any> {
    return this.get({
      apiName: "matter-document-list",
      baseURL: "http://localhost:1007/api",
      path: `/matter/${matterIdentifier}/document`,
      headers: this.toHeaders(),
    });
  }

  async saveGeneratedDocument(
    matterId: number | string,
    templateId: number | string,
    data: Record<string, any>
  ): Promise<any> {
    return this.post({
      apiName: "matter-document-generate",
      baseURL: "http://localhost:1007/api",
      path: `/matter/${matterId}/document/${templateId}/generate`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  /** Fetch a saved matter document by ID. */
  async getMatterDocument(matterId: number | string, documentId: number | string): Promise<any> {
    return this.get({
      apiName: "matter-document-get",
      baseURL: "http://localhost:1007/api",
      path: `/matter/${matterId}/document/${documentId}/doc`,
      headers: this.toHeaders(),
    });
  }

  /** Fetch the master catalog of document templates (name, category, default content/variables). */
  async getDocumentTemplates(): Promise<any> {
    return this.get({
      apiName: "master-document-templates",
      baseURL: "http://localhost:1007/api",
      path: `/master/document`,
      headers: this.toHeaders(),
    });
  }

  /** Save composer edits back to document_templates_content. */
  async updateTemplate(templateId: number | string, data: Record<string, any>): Promise<any> {
    return this.put({
      apiName: "document-template-update",
      baseURL: "http://localhost:1007/api",
      path: `/templates/${templateId}`,
      body: data,
      headers: this.toHeaders(),
    });
  }

  /** Save composer edits back to an existing matter document. */
  async updateMatterDocument(
    matterId: number | string,
    documentId: number | string,
    data: Record<string, any>
  ): Promise<any> {
    return this.put({
      apiName: "matter-document-update",
      baseURL: "http://localhost:1007/api",
      path: `/matter/${matterId}/document/${documentId}/update`,
      body: data,
      headers: this.toHeaders(),
    });
  }
}
