import type { JSONContent } from "@tiptap/core";

export interface DocumentTemplateVariable {
  key: string;
  label: string;
  /** e.g. "client.firstName", "case.caseTitle", or "manual" for user-entered values. */
  dataSource?: string;
  /** Value used when generating this document from the template. */
  value?: string;
  required?: boolean;
}

export interface DocumentTemplateSummary {
  id: number;
  name: string;
  category: string;
  /** ProseMirror JSON — the source of truth for content (matches Tiptap's editor.getJSON()). */
  contentJson: JSONContent | string;
  variables: DocumentTemplateVariable[];
}

export type ComposerMode = "edit" | "preview";

export interface ComposedDocumentResult {
  documentId?: string;
  documentName: string;
  /** The template this content was saved back to (document_templates_content). */
  templateId: number;
  /** Resolved (preview mode) or raw (edit mode) ProseMirror JSON, serialized as a string. */
  contentJson: string;
  /** Current variable definitions, including dynamically added or removed variables. */
  variables: DocumentTemplateVariable[];
  /** User-editable values keyed by the variable key. */
  variableValues: Record<string, string>;
}
