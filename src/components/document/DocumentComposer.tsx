import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { useReactToPrint } from "react-to-print";
import { Modal } from "@components/ui/modal";
import { useModal } from "@hooks/useModal";
import { FieldLabel, inputCls } from "@pages/CaseManager/steps/_shared";
import DocumentCanvas, { type DocumentCanvasHandle } from "./DocumentCanvas";
import VariablesPanel from "./VariablesPanel";
import { resolveForPreview } from "./resolvePreview";
import type {
  ComposedDocumentResult,
  ComposerMode,
  DocumentTemplateSummary,
  DocumentTemplateVariable,
} from "./types";

export interface DocumentComposerHandle {
  /** Runs `action` immediately, or prompts the leave-confirmation modal first when there are unsaved changes. Used by parents that swap/unmount the composer outside of routing (tabs, re-opening a different document). */
  confirmLeave: (action: () => void) => void;
}

interface DocumentComposerProps {
  templates: DocumentTemplateSummary[];
  /** Full template catalog for the picker dropdown (e.g. fetched from /master/document). Falls back to `templates` when omitted. */
  availableTemplates?: DocumentTemplateSummary[];
  /** Pre-select a template (e.g. when re-opening an existing document for editing). Defaults to the first template. */
  initialTemplateId?: number;
  /** Resolved values keyed by variable key (e.g. "clientName" -> "John Doe"), used in preview mode. */
  dataContext?: Record<string, string>;
  documentId?: string | undefined;
  onSave: (result: ComposedDocumentResult) => void;
}

/** Three-part document composer: template picker + edit/preview toggle, Tiptap canvas, variables panel. */
const DocumentComposer = forwardRef<DocumentComposerHandle, DocumentComposerProps>(function DocumentComposer(
  { documentId, templates, availableTemplates, initialTemplateId, dataContext = {}, onSave },
  ref,
) {
  const canvasRef = useRef<DocumentCanvasHandle>(null);
  const printContentRef = useRef<HTMLDivElement>(null);
  const initialTemplate = templates.find((t) => t.id === initialTemplateId) ?? templates[0] ?? null;
  const draftJson = useRef<JSONContent | string>(initialTemplate?.contentJson ?? "");

  const [mode, setMode] = useState<ComposerMode>("edit");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(initialTemplate?.id ?? null);
  const [variables, setVariables] = useState<DocumentTemplateVariable[]>(initialTemplate?.variables ?? []);
  const [documentName, setDocumentName] = useState(initialTemplate?.name ?? "");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const leaveConfirmModal = useModal(false);
  const templatePickerModal = useModal(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;
  const initialDocumentNameRef = useRef(initialTemplate?.name ?? "");
  const initialVariableSnapshotRef = useRef(JSON.stringify(initialTemplate?.variables ?? []));
  const initialContentSnapshotRef = useRef(JSON.stringify(initialTemplate?.contentJson ?? ""));

  const refreshDirtyState = () => {
    const currentContent = canvasRef.current?.getJSON() ?? draftJson.current ?? "";
    const nextDirty =
      documentName !== initialDocumentNameRef.current ||
      JSON.stringify(variables) !== initialVariableSnapshotRef.current ||
      JSON.stringify(currentContent) !== initialContentSnapshotRef.current ||
      selectedTemplateId !== (initialTemplate?.id ?? null);

    setIsDirty(nextDirty);
  };

  useEffect(() => {
    refreshDirtyState();
  }, [documentName, variables, selectedTemplateId, mode]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const interceptHistory = (method: "pushState" | "replaceState", original: typeof window.history.pushState) => {
      const nextMethod = function (this: History, ...args: Parameters<typeof original>) {
        const callback = pendingNavigationRef.current;
        if (callback) {
          return original.apply(this, args);
        }
        if (window.confirm("You have unsaved changes. Leave without saving?")) {
          return original.apply(this, args);
        }
        return undefined;
      };

      window.history[method] = nextMethod as typeof original;
    };

    interceptHistory("pushState", originalPushState);
    interceptHistory("replaceState", originalReplaceState);

    const handlePopState = () => {
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty]);

  const confirmLeave = (nextAction: () => void) => {
    if (!isDirty) {
      nextAction();
      return;
    }

    pendingNavigationRef.current = nextAction;
    leaveConfirmModal.openModal();
  };

  const handleLeaveConfirmed = () => {
    const nextAction = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    leaveConfirmModal.closeModal();
    nextAction?.();
  };

  const handleLeaveCancelled = () => {
    pendingNavigationRef.current = null;
    leaveConfirmModal.closeModal();
  };

  useImperativeHandle(ref, () => ({ confirmLeave }));

  const resolveVariableValues = (templateVariables: DocumentTemplateVariable[]) =>
    templateVariables.reduce<Record<string, string>>((values, variable) => {
      values[variable.key] = variable.value ?? dataContext[variable.key] ?? "";
      return values;
    }, {});

  const handleSelectTemplate = (templateId: number) => {
    const applyTemplate = () => {
      const template = (availableTemplates ?? templates).find((t) => t.id === templateId);
      if (!template) return;
      templatePickerModal.closeModal();
      setSelectedTemplateId(templateId);
      setVariables(template.variables);
      draftJson.current = template.contentJson;
      canvasRef.current?.setContent(template.contentJson);
      setMode("edit");
      setTimeout(() => {
        initialVariableSnapshotRef.current = JSON.stringify(template.variables ?? []);
        initialContentSnapshotRef.current = JSON.stringify(template.contentJson ?? "");
        setIsDirty(false);
      }, 0);
    };

    confirmLeave(applyTemplate);
  };

  const toggleMode = (next: ComposerMode) => {
    if (next === mode) return;
    if (next === "preview") {
      draftJson.current = canvasRef.current?.getJSON() ?? draftJson.current;
      canvasRef.current?.setContent(resolveForPreview(draftJson.current as JSONContent, resolveVariableValues(variables)));
      setPreviewHtml(canvasRef.current?.getHTML() ?? "");
    } else {
      canvasRef.current?.setContent(draftJson.current);
    }
    setMode(next);
  };

  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: documentName || "document-preview",
    pageStyle: `
      @page { margin: 16mm; }
      .document-print-content { display: block !important; color: #111827; font-size: 12pt; line-height: 1.6; }
      .document-print-content h1 { font-size: 22pt; }
      .document-print-content h2 { font-size: 18pt; }
      .document-print-content h3 { font-size: 15pt; }
      .document-print-content p { margin: 0 0 0.8em; }
      /* getHTML() serializes blank lines as truly empty <p></p> (ProseMirror's trailing <br> hack isn't kept),
         so they collapse to zero height in the printed output — force a line box so the spacing survives. */
      .document-print-content p:empty::before { content: "\\00a0"; }
    `,
  });

  const handleInsertVariable = (variable: DocumentTemplateVariable) => {
    canvasRef.current?.insertVariable(variable.key, variable.label);
  };

  const handleVariableValueChange = (key: string, value: string) => {
    setVariables((currentVariables) => currentVariables.map((variable) => (
      variable.key === key ? { ...variable, value } : variable
    )));
  };

  const handleAddVariable = (variable: DocumentTemplateVariable) => {
    if (variables.some((currentVariable) => currentVariable.key === variable.key)) return false;
    setVariables((currentVariables) => [...currentVariables, variable]);
    return true;
  };

  const handleDeleteVariable = (key: string) => {
    setVariables((currentVariables) => currentVariables.filter((variable) => variable.key !== key));
    canvasRef.current?.removeVariable(key);
  };

  const handleSave = () => {
    if (documentId == null) return;

    const json = mode === "edit" ? canvasRef.current?.getJSON() ?? draftJson.current : draftJson.current;
    onSave({
      documentId,
      documentName,
      templateId: selectedTemplateId || 1,
      contentJson: JSON.stringify(json),
      variables,
      variableValues: resolveVariableValues(variables),
    });

    initialDocumentNameRef.current = documentName;
    initialVariableSnapshotRef.current = JSON.stringify(variables);
    initialContentSnapshotRef.current = JSON.stringify(json ?? "");
    setIsDirty(false);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">

            <div className="flex flex-wrap items-center gap-2 border border-gray-200 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900">
              <div className="min-w-0 flex-1 basis-40">
                <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-200">Doc:</span>
                {/* <input
                  className={`${inputCls} w-full border-0 bg-transparent px-0 shadow-none focus:ring-0`}
                  value={documentName}
                  readOnly={true}
                  onChange={(e) => setDocumentName(e.target.value)}
                /> */}
                <h3 className="min-w-0 truncate text-sm font-semibold text-indigo-800 dark:text-indigo-300">{documentName}</h3>
                </div>
              </div>


              {/* <button
                type="button"
                onClick={templatePickerModal.openModal}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <i className="ti ti-template text-sm" />
                Choose template
              </button> */}


              <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-1 border-gray-200 dark:border-gray-700 sm:w-auto sm:border-l sm:pl-2">

                <button
                  type="button"
                  onClick={templatePickerModal.openModal}
                  className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <i className="ti ti-template text-sm" />
                  Choose template
                </button>
                <button
                  type="button"
                  onClick={() => toggleMode("edit")}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors ${mode === "edit"
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => toggleMode("preview")}
                  className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors ${mode === "preview"
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                >
                  Preview
                </button>
                {mode === "preview" && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    //  className="flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
                    className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-brand-500 bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    <i className="ti ti-printer text-sm" />
                    Print
                  </button>
                )}
              </div>
            </div>

            {/* <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">{documentName}</h3> */}


            <div className=" flex-1">
              <DocumentCanvas
                ref={canvasRef}
                initialContent={selectedTemplate?.contentJson}
                editable={mode === "edit"}
                onChange={refreshDirtyState}
              />
            </div>
          </div>

          <VariablesPanel
            variables={variables}
            onInsert={handleInsertVariable}
            onValueChange={handleVariableValueChange}
            onAdd={handleAddVariable}
            onDelete={handleDeleteVariable}
            disabled={mode !== "edit"}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg border border-brand-500 bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <i className="ti ti-device-floppy text-sm" />
            Update Document
          </button>
        </div>

        <div
          ref={printContentRef}
          className="document-print-content hidden print:block"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>

      <Modal
        isOpen={templatePickerModal.isOpen}
        onClose={templatePickerModal.closeModal}
        className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
        closeOnOutsideClick={true}
        showCloseButton={true}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose template</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Selecting a different template will replace the editor content and variables.
            </p>
          </div>
          <select
            autoFocus
            className={`${inputCls} w-full`}
            value={selectedTemplateId ?? ""}
            onChange={(event) => handleSelectTemplate(Number(event.target.value))}
          >
            {(availableTemplates ?? templates).map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}{template.category ? ` · ${template.category}` : ""}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        isOpen={leaveConfirmModal.isOpen}
        onClose={handleLeaveCancelled}
        className="max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
        closeOnOutsideClick={true}
        showCloseButton={true}
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leave without saving?</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              You have unsaved changes in this document. Do you want to discard them and continue?
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleLeaveCancelled}
              className="border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              No, stay
            </button>
            <button
              type="button"
              onClick={handleLeaveConfirmed}
              className="bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Yes, discard
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
});

export default DocumentComposer;
