import type { JSONContent } from "@tiptap/core";

/**
 * Walks a ProseMirror JSON tree and replaces "variable" atom nodes with resolved
 * "text" nodes, using dataContext[key] or a "[Label]" placeholder when unresolved.
 */
export function resolveForPreview(
  docJson: JSONContent,
  dataContext: Record<string, string | undefined>,
): JSONContent {
  const walk = (node: JSONContent): JSONContent => {
    if (node.type === "variable") {
      const key = node.attrs?.key as string | undefined;
      const label = (node.attrs?.label as string | undefined) ?? key;
      const value = (key && dataContext[key]) || `[${label ?? "?"}]`;
      return { type: "text", text: value };
    }
    if (node.content) {
      return { ...node, content: node.content.map(walk) };
    }
    return node;
  };
  return walk(structuredClone(docJson));
}
