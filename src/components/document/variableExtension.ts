import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    variable: {
      /** Insert a `${key}` variable chip at the current selection. */
      insertVariable: (key: string, label?: string) => ReturnType;
    };
  }
}

const CHIP_CLASS =
  "variable-chip inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300";

/** Inline atom node rendering `${key}` as a non-editable chip; carries key/label attrs. */
export const VariableNode = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-variable": node.attrs.key, class: CHIP_CLASS }),
      `\${${node.attrs.key}}`,
    ];
  },

  addCommands() {
    return {
      insertVariable:
        (key: string, label?: string) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs: { key, label } }).run(),
    };
  },
});
