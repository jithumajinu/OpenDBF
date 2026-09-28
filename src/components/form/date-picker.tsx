import { useEffect, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon, CloseIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  onClear?: () => void;
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  onClear,
  label,
  defaultDate,
  placeholder,
  disabled = false,
}: PropsType) {
  const [hasValue, setHasValue] = useState(!!defaultDate);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const handleChange: Hook = (dates, dateStr, instance) => {
      setHasValue(dates.length > 0);
      if (typeof onChange === "function") onChange(dates, dateStr, instance);
      else if (Array.isArray(onChange)) onChange.forEach((fn) => fn(dates, dateStr, instance));
    };

    const flatPickr = flatpickr(`#${id}`, {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate,
      onChange: handleChange,
    });

    return () => {
      if (!Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [mode, onChange, id, defaultDate, disabled]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={disabled}
          className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
            disabled
              ? "text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
              : "bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
          }`}
        />

        {onClear && hasValue && (
          <button
            type="button"
            title="Clear date"
            onClick={() => { setHasValue(false); onClear(); }}
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <CloseIcon className="h-4 w-4 text-error-500" />
          </button>
        )}

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
