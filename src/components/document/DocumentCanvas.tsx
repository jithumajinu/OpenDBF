import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { Mark, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { VariableNode } from "./variableExtension";
import DocumentToolbar, { PAPER_SIZES, type PaperSize } from "./DocumentToolbar";

const Highlight = Mark.create({
  name: "highlight",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => (element as HTMLElement).getAttribute("data-color") || "",
        renderHTML: (attributes) => (attributes.color ? { "data-color": attributes.color } : {}),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "mark",
        getAttrs: (element) => {
          const htmlElement = element as HTMLElement;
          const color = htmlElement.getAttribute("data-color") || htmlElement.style.backgroundColor || "";
          return color ? { color } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const color = HTMLAttributes.color || "#fff3a3";

    return [
      "mark",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-color": color,
        style: `background-color: ${color};`,
      }),
      0,
    ];
  },
});

export interface DocumentCanvasHandle {
  insertVariable: (key: string, label?: string) => void;
  removeVariable: (key: string) => void;
  getJSON: () => JSONContent;
  getHTML: () => string;
  setContent: (content: JSONContent | string) => void;
}

const PAGE_GAP = 24;

interface DocumentCanvasProps {
  initialContent?: JSONContent | string;
  editable: boolean;
  placeholder?: string;
  /** Fired on every content edit (not on programmatic setContent calls), used to track unsaved changes. */
  onChange?: () => void;
}

/** Tiptap canvas rendering document content with `${key}` variables as atom chips. */
const DocumentCanvas = forwardRef<DocumentCanvasHandle, DocumentCanvasProps>(function DocumentCanvas(
  { initialContent, editable, placeholder = "Start drafting the document…", onChange },
  ref,
) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      VariableNode,
      Highlight,
    ],
    content: initialContent ?? "",
    editable,
    onUpdate: () => onChange?.(),
  });
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [highlightMenuOpen, setHighlightMenuOpen] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");
  const [pageCount, setPageCount] = useState(1);

  const highlightColors = [
    { name: "green", value: "#b7f2c7" },
    { name: "pink", value: "#f7c7d8" },
    { name: "yellow", value: "#f5e7a3" },
    { name: "blue", value: "#cfe7ff" },
    { name: "purple", value: "#d8d1ff" },
    { name: "red", value: "#ffd3d3" },
  ];

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (!headingMenuOpen) return;

    const handleEditorPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const toolbar = target.closest(".heading-menu-root");
      if (!toolbar) {
        setHeadingMenuOpen(false);
      }
    };

    const timeout = window.setTimeout(() => {
      window.addEventListener("mousedown", handleEditorPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("mousedown", handleEditorPointerDown);
    };
  }, [headingMenuOpen]);

  useEffect(() => {
    if (!listMenuOpen) return;

    const handleEditorPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const toolbar = target.closest(".list-menu-root");
      if (!toolbar) {
        setListMenuOpen(false);
      }
    };

    const timeout = window.setTimeout(() => {
      window.addEventListener("mousedown", handleEditorPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("mousedown", handleEditorPointerDown);
    };
  }, [listMenuOpen]);

  useEffect(() => {
    if (!highlightMenuOpen) return;

    const handleEditorPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const toolbar = target.closest(".highlight-menu-root");
      if (!toolbar) {
        setHighlightMenuOpen(false);
      }
    };

    const timeout = window.setTimeout(() => {
      window.addEventListener("mousedown", handleEditorPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("mousedown", handleEditorPointerDown);
    };
  }, [highlightMenuOpen]);

  useImperativeHandle(
    ref,
    () => ({
      insertVariable: (key, label) => {
        editor?.chain().focus().insertVariable(key, label).run();
      },
      removeVariable: (key) => {
        const content = editor?.getJSON();
        if (!content) return;

        const removeNodes = (node: JSONContent): JSONContent => ({
          ...node,
          content: node.content?.flatMap((child) => (
            child.type === "variable" && child.attrs?.key === key ? [] : [removeNodes(child)]
          )),
        });

        editor.commands.setContent(removeNodes(content));
      },
      getJSON: () => editor?.getJSON() ?? { type: "doc", content: [] },
      getHTML: () => editor?.getHTML() ?? "",
      setContent: (content) => editor?.commands.setContent(content),
    }),
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="tiptap-editor-content rounded-lg border border-white/60 bg-white  focus-within:outline-none dark:border-gray-800 dark:bg-gray-900">
      <DocumentToolbar
        editor={editor}
        paperSize={paperSize}
        pageCount={pageCount}
        onPaperSizeChange={setPaperSize}
        onPageCountChange={setPageCount}
      />
      <div
        className="min-h-[420px] cursor-text overflow-x-auto border border-gray-200 bg-gray-100 p-4 dark:border-gray-700 dark:bg-gray-950"
        onClick={() => editor.commands.focus()}
        onMouseDown={() => editor.commands.focus()}
      >
        <div className="relative mx-auto" style={{ width: PAPER_SIZES[paperSize].width }}>
          {/* Page frames — decorative boundaries showing where each page would break. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col" style={{ gap: PAGE_GAP }}>
            {Array.from({ length: pageCount }).map((_, index) => (
              <div
                key={index}
                className="relative shrink-0 rounded-sm border-2 border-dashed border-gray-300 dark:border-gray-700"
                style={{ width: PAPER_SIZES[paperSize].width, height: PAPER_SIZES[paperSize].height }}
              >
                {/* Footer separator marking the end of this page, centered in the gap before the next one. */}
                {index < pageCount - 1 && (
                  <span
                    className="absolute left-1/2 w-24 -translate-x-1/2 border-t-2 border-dashed border-gray-400 dark:border-gray-500"
                    style={{ top: `calc(100% + ${PAGE_GAP / 2}px)` }}
                  />
                )}
              </div>
            ))}
          </div>

          <EditorContent
            editor={editor}
            className="relative bg-white p-3 dark:bg-gray-900"
            style={{
              minHeight: pageCount * PAPER_SIZES[paperSize].height + (pageCount - 1) * PAGE_GAP,
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default DocumentCanvas;
