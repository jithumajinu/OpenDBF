import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { JSONContent } from "@tiptap/core";
import {
  FieldLabel,
  inputCls,
  type StepHandle,
} from "./_shared";
import { useAppDispatch, useAppSelector } from "@appAssets/hooks/useAppDispatch";
import { loadDocumentsAsync, loadDocumentTemplatesAsync, setDocuments, type MatterDocumentItem } from "@appAssets/store/caseSlice";
import { notifyMessage } from "@appAssets/utils/JToast.tsx";
import { TrashBinIcon } from "@appAssets/icons";
import { DocumentComposer, type DocumentComposerHandle, type DocumentTemplateSummary } from "@components/document";
import { ApiService } from "@apiServices/ApiService";

const DOCUMENT_TYPES = [
  { value: "1", label: "Pleading" },
  { value: "2", label: "Evidence" },
  { value: "3", label: "Order" },
  { value: "4", label: "Correspondence" },
  { value: "5", label: "Identity proof" },
  { value: "6", label: "Other" },
];
const DEFAULT_DOCUMENT_TEMPLATE_ID = 1;

interface DocumentsFormData {
  document: MatterDocumentItem;
}

const emptyDocument = (): MatterDocumentItem => ({
  id: null,
  documentName: "",
  documentType: "1",
  fileUrl: "",
});

export default forwardRef<StepHandle>(function Step6Documents(_, ref) {
  const dispatch = useAppDispatch();
  const matterId = useAppSelector((s) => s.case.matterId);
  const savedDocuments = useAppSelector((s) => s.case.matter.documents);
  const documentTemplates = useAppSelector((s) => s.case.documentTemplates);
  const step1Data = useAppSelector((s) => s.case.step1Data);
  const step2Data = useAppSelector((s) => s.case.step2Data);

  const { register, control, handleSubmit, reset } = useForm<DocumentsFormData>({
    defaultValues: { document: emptyDocument() },
  });

  const [activeTab, setActiveTab] = useState<"list" | "compose">("list");
  const [editingDocument, setEditingDocument] = useState<MatterDocumentItem | null>(null);
  const [composerTemplates, setComposerTemplates] = useState<DocumentTemplateSummary[]>([]);
  const [composerLoading, setComposerLoading] = useState(false);
  const composerRef = useRef<DocumentComposerHandle>(null);

  /** Routes an action through the composer's unsaved-changes prompt when it's currently mounted. */
  const withComposerLeaveGuard = (action: () => void) => {
    if (activeTab === "compose" && composerRef.current) {
      composerRef.current.confirmLeave(action);
      return;
    }
    action();
  };

  useEffect(() => {
    if (matterId) {
      dispatch(loadDocumentsAsync(matterId));
    }
  }, [dispatch, matterId]);

  /** Load the master template catalog (name/category/content) for the composer's template picker. */
  useEffect(() => {
    dispatch(loadDocumentTemplatesAsync());
  }, [dispatch]);

  const handleAddNew = () => {
    reset({ document: emptyDocument() });
    setActiveTab("list");
  };

  /** Merge the server's saved template content (document_templates_content) over the static fallback. */
  const buildTemplateSummary = (data: any, fallback: DocumentTemplateSummary): DocumentTemplateSummary => {
    let contentJson: JSONContent | string = fallback.contentJson;
    if (typeof data?.contentJson === "string" && data.contentJson.trim()) {
      try {
        contentJson = JSON.parse(data.contentJson);
      } catch {
        // Keep the fallback content if the saved JSON can't be parsed.
      }
    }

    // The API stores variables under `contentJsonVariables` (serialized JSON), not `variables`.
    let variables = fallback.variables;
    const rawVariables = data?.variables ?? data?.contentJsonVariables;
    if (Array.isArray(rawVariables) && rawVariables.length > 0) {
      variables = rawVariables;
    } else if (typeof rawVariables === "string" && rawVariables.trim()) {
      try {
        const parsed = JSON.parse(rawVariables);
        if (Array.isArray(parsed) && parsed.length > 0) variables = parsed;
      } catch {
        // Keep the fallback variables if the saved JSON can't be parsed.
      }
    }

    return {
      id: data?.id ?? fallback.id,
      // The matter-document API returns the saved name as `documentName`, not `name` (that's the template's own field).
      name: data?.documentName ?? data?.name ?? fallback.name,
      // The master catalog exposes `documentType` instead of a dedicated `category` field.
      category: data?.category ?? data?.documentType ?? fallback.category,
      variables,
      contentJson,
    };
  };

  /** Open the composer, loading the latest saved matter-document content for editing if this document already has one. */
  const openCompose = async (document?: MatterDocumentItem) => {
    const templateId = document?.templateId ?? DEFAULT_DOCUMENT_TEMPLATE_ID;
    const docId = document?.id;
    const fallback = documentTemplates.find((t) => t.id === templateId) ?? documentTemplates[0] ?? {
      id: templateId,
      name: "",
      category: "",
      variables: [],
      contentJson: "",
    };

    // Prefer the name already known from the documents list so the field is correct even before/without a server round-trip.
    const namedFallback: DocumentTemplateSummary = document?.documentName ? { ...fallback, name: document.documentName } : fallback;

    setEditingDocument(document ?? null);
    setComposerLoading(true);
    setActiveTab("compose");

    try {
      if (!matterId || docId == null) {
        setComposerTemplates([namedFallback]);
        return;
      }

      const response = await ApiService.getInstance().documentService.getMatterDocument(matterId, docId);
      const data = response?.data?.data ?? response?.data ?? {};
      setComposerTemplates([buildTemplateSummary(data, namedFallback)]);
    } catch {
      setComposerTemplates([namedFallback]);
    } finally {
      setComposerLoading(false);
    }
  };

  const persistDocument = async (document: MatterDocumentItem, templateId: number | string = DEFAULT_DOCUMENT_TEMPLATE_ID) => {
    if (!matterId) {
      notifyMessage("Matter is not selected", "ERROR");
      return null;
    }

    const trimmedName = document.documentName?.trim() ?? "";
    if (!trimmedName) {
      notifyMessage("Enter a document name", "ERROR");
      return null;
    }

    const payload = {
      documentName: trimmedName,
      documentType: document.documentType || "1",
      fileUrl: document.fileUrl?.trim() ?? "",
    };

    const response = await ApiService.getInstance().documentService.saveGeneratedDocument(matterId, templateId, payload);
    const result = response?.data?.data ?? response?.data ?? response ?? {};
    const savedId =
      result?.id ??
      result?.documentId ??
      result?.docId ??
      result?.document?.id ??
      result?.document?.documentId ??
      result?.data?.id ??
      result?.data?.documentId ??
      document.id ??
      null;

    if (response?.hasError || response?.errorMessage) {
      notifyMessage(response?.errorMessage || "Unable to save document", "ERROR");
      return null;
    }

    const savedDocument: MatterDocumentItem = {
      ...document,
      id: savedId,
      documentName: trimmedName,
      documentType: document.documentType || "1",
      fileUrl: document.fileUrl?.trim() ?? "",
      templateId: typeof result?.templateId === "number" ? result.templateId : Number(templateId),
    };

    dispatch(setDocuments([...savedDocuments, savedDocument]));
    notifyMessage("Document saved successfully", "SUCCESS");
    return savedDocument;
  };

  const handleSave = handleSubmit(async (data) => {
    const savedDocument = await persistDocument({
      ...data.document,
      documentName: data.document.documentName,
      fileUrl: data.document.fileUrl ?? "",
    });

    if (savedDocument) {
      reset({ document: emptyDocument() });
      setActiveTab("list");
      return true;
    }

    return false;
  });

  const handleComposedSave = async ({ documentId, documentName, contentJson, variables, variableValues }: {
    documentId?: string;
    documentName: string;
    contentJson: string;
    templateId: number;
    variables: DocumentTemplateSummary["variables"];
    variableValues: Record<string, string>;
  }) => {
    if (!matterId || !documentId) {
      notifyMessage("Matter or document is not selected", "ERROR");
      return;
    }

    const savedVariables = variables.map((variable) => ({
      ...variable,
      value: variableValues[variable.key] ?? "",
    }));

    try {
      const documentResponse = await ApiService.getInstance().documentService.updateMatterDocument(matterId, documentId, {
        documentName,
        documentType: editingDocument?.documentType || "1",
        fileUrl: editingDocument?.fileUrl?.trim() ?? "",
        contentJson,
        variables: savedVariables,
      });
      if (documentResponse?.hasError || documentResponse?.errorMessage) {
        notifyMessage(documentResponse?.errorMessage || "Unable to save document content", "ERROR");
        return;
      }

      dispatch(setDocuments(
        savedDocuments.map((document) => (
          String(document.id) === String(documentId)
            ? { ...document, documentName, contentJson, variables: savedVariables }
            : document
        )),
      ));

      notifyMessage(editingDocument ? "Document updated successfully" : "Document saved successfully", "SUCCESS");
      setEditingDocument((currentDocument) => currentDocument
        ? { ...currentDocument, documentName, contentJson, variables: savedVariables }
        : currentDocument);
    } catch (error: any) {
      notifyMessage(error?.message || "Unable to save document content", "ERROR");
    }
  };

  useImperativeHandle(ref, () => ({
    submit: () => Promise.resolve(true),
    clear: () => {
      reset({ document: emptyDocument() });
      dispatch(setDocuments([]));
      setActiveTab("list");
    },
    confirmLeave: (action) => withComposerLeaveGuard(action),
  }));

  return (
    <div>
      <div className="mb-5 flex items-center gap-6 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => withComposerLeaveGuard(() => setActiveTab("list"))}
          className={`flex items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${activeTab === "list"
            ? "border-brand-500 text-brand-600 dark:text-brand-400"
            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"}`}
        >
          <i className="ti ti-file-text text-base" />
          Documents ({savedDocuments.length})
        </button>
        {/* <div
          className={`flex items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-medium ${activeTab === "compose"
            ? "border-brand-500 text-brand-600 dark:text-brand-400"
            : "border-transparent text-gray-500 dark:text-gray-400"}`}
        > */}
        <div>
          {activeTab === "compose"
            ? <button
              type="button"
              onClick={() => withComposerLeaveGuard(() => setActiveTab("list"))}
              className="flex items-center gap-1.5 px-1 pb-3 text-sm font-medium transition-colors"
            >
              Back to List
            </button>
            : ""}
        </div>
      </div>

      {activeTab === "list" && (
        <>
          <form onSubmit={(event) => { event.preventDefault(); void handleSave(); }}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr_1.4fr_auto] sm:items-end">
              <div>
                <FieldLabel>Document name</FieldLabel>
                <div className="relative">
                  <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                  <input
                    className={`${inputCls} pl-9`}
                    placeholder="e.g. Vakalatnama"
                    {...register("document.documentName")}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Type</FieldLabel>
                <div className="relative">
                  <i className="ti ti-user pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                  <select className={`${inputCls} pl-9`} {...register("document.documentType")}>
                    {DOCUMENT_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel>Document URL</FieldLabel>
                <div className="relative">
                  <i className="ti ti-link pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                  <input
                    type="url"
                    className={`${inputCls} pl-9`}
                    placeholder="https://example.com/document.pdf"
                    {...register("document.fileUrl")}
                  />
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-default disabled:opacity-50"
                >
                  <i className="ti ti-cloud-upload text-sm" />
                  Save Document
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6">
            {savedDocuments.length > 0 ? (
              <div className="flex flex-col gap-3">
                {savedDocuments.map((document, index) => {
                  const tileVariants = [
                    { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
                    { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
                  ];
                  const tile = tileVariants[index % tileVariants.length];
                  const fileName = document.fileUrl?.split("/").pop();
                  const typeLabel = DOCUMENT_TYPES.find((option) => option.value === document.documentType)?.label ?? document.documentType;

                  return (
                    <div key={document.id ?? `${document.documentName}-${index}`} className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl ${tile.bg} ${tile.text}`}>
                        <i className="ti ti-file-type-pdf" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{document.documentName}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{typeLabel}</p>
                        {document.fileUrl && (
                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block truncate text-xs text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {fileName || document.fileUrl}
                          </a>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Compose ${document.documentName}`}
                          onClick={() => withComposerLeaveGuard(() => void openCompose(document))}
                          className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 dark:border-brand-500/30 dark:bg-transparent dark:text-brand-400 dark:hover:bg-brand-500/10"
                        >
                          <i className="ti ti-external-link text-sm" />
                          Open in Editor
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${document.documentName}`}
                          onClick={() => dispatch(setDocuments(savedDocuments.filter((_, itemIndex) => itemIndex !== index)))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:border-gray-700"
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                        <span
                          title="Saved"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                        >
                          <i className="ti ti-check text-sm" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No documents added yet.</div>
            )}
          </div>
        </>
      )}

      {activeTab === "compose" && (
        <>
          {/* {editingDocument && (
            <p className="mb-2 text-xs font-medium text-brand-600 dark:text-brand-400">
              Editing content used by "{editingDocument.documentName}"
            </p>
          )} */}
          {composerLoading || composerTemplates.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">Loading template…</div>
          ) : (
            <DocumentComposer
              ref={composerRef}
              key={editingDocument?.id ?? composerTemplates[0]?.id ?? "new"}
              templates={composerTemplates}
              availableTemplates={documentTemplates}
              initialTemplateId={composerTemplates[0]?.id}
              documentId={editingDocument?.id != null ? String(editingDocument.id) : undefined}
              dataContext={{
                clientName: step1Data?.matterName ?? "",
                caseTitle: step2Data?.caseTitle ?? "",
                courtName: step2Data?.courtName ?? "",
                testName: "Jithu",
              }}
              onSave={handleComposedSave}
            />
          )}
        </>
      )}

    </div>
  );
});

