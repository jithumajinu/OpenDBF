import { useState } from "react";
import type { DocumentTemplateVariable } from "./types";

interface VariablesPanelProps {
  variables: DocumentTemplateVariable[];
  onInsert: (variable: DocumentTemplateVariable) => void;
  onValueChange: (key: string, value: string) => void;
  onAdd: (variable: DocumentTemplateVariable) => boolean;
  onDelete: (key: string) => void;
  disabled?: boolean;
}

/** Right-hand pane: field list bound to the active template, click-to-insert into the canvas. */
const toCamelCase = (value: string) => {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9\s-_/]+/g, "")
    .replace(/[_\-\s]+(.)/g, (_, letter: string) => letter.toUpperCase())
    .replace(/^(.)/, (letter: string) => letter.toLowerCase());

  return cleaned.replace(/[^a-zA-Z0-9]/g, "");
};

export default function VariablesPanel({ variables, onInsert, onValueChange, onAdd, onDelete, disabled }: VariablesPanelProps) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const generatedKey = toCamelCase(label);

  const handleAdd = () => {
    const variableLabel = label.trim();
    const variableKey = generatedKey;

    if (!variableLabel) {
      setError("Enter a variable label.");
      return;
    }

    if (!variableKey) {
      setError("Label must contain letters or numbers.");
      return;
    }

    const duplicateLabel = variables.some((variable) => variable.label.trim().toLowerCase() === variableLabel.toLowerCase());
    if (duplicateLabel) {
      setError("Variable label already exists.");
      return;
    }

    const duplicateKey = variables.some((variable) => variable.key === variableKey);
    if (duplicateKey) {
      setError("Variable key already exists.");
      return;
    }

    if (!onAdd({ key: variableKey, label: variableLabel, dataSource: "manual", value: "" })) {
      setError("A variable with this key already exists.");
      return;
    }
    setAdding(false);
    setLabel("");
    setError("");
  };

  return (
    <div className="flex h-full flex-col border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Variables</h3>
        <button
          type="button"
          disabled={disabled}
          onClick={() => { setAdding(true); setError(""); }}
          className="border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <i className="ti ti-plus mr-1" />
          Add variable
        </button>
      </div>
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Click a field to insert it into the document.</p>

      {adding && (
        <div className="mt-3 border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <label className="min-w-[70px] text-[11px] font-medium text-gray-600 dark:text-gray-300">Label</label>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Enter variable label"
              className="w-full border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="min-w-[70px] text-[11px] font-medium text-gray-600 dark:text-gray-300">Key</label>
            <input
              value={generatedKey}
              readOnly
              className="w-full border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-700 outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300"
            />
          </div>
          {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
            <button type="button" onClick={handleAdd} className="bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">Add</button>
          </div>
        </div>
      )}

      {variables.length === 0 ? (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          No variables defined for this template.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {variables.map((variable) => (
            <li key={variable.key}>
              <div className="border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onInsert(variable)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-blue-400"
                  >
                    <span className="text-xs font-medium text-gray-800 dark:text-white">
                      {variable.label || variable.key}
                      {variable.required && <span className="ml-1 text-red-500">*</span>}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {"${" + variable.key + "}"}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Delete ${variable.label || variable.key}`}
                    onClick={() => onDelete(variable.key)}
                    className="flex shrink-0 items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
                <input
                  value={variable.value ?? ""}
                  onChange={(event) => onValueChange(variable.key, event.target.value)}
                  placeholder={`Enter ${variable.label || variable.key}`}
                  className="mt-2 w-full border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
