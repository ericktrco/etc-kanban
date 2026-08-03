import { t } from "@lingui/core/macro";
import { HiCheck, HiXMark } from "react-icons/hi2";

import { colours } from "@kan/shared/constants";

interface ColorPickerProps {
  selectedColor?: string | null;
  onChange: (color: string | null) => void;
  label?: string;
}

export default function ColorPicker({
  selectedColor,
  onChange,
  label = t`Select color`,
}: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-light-800 dark:text-dark-800">
          {label}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          title={t`Default / None`}
          className={`flex h-7 w-7 items-center justify-center rounded-full border border-light-400 bg-light-200 transition-all hover:scale-105 focus:outline-none dark:border-dark-400 dark:bg-dark-300 ${
            !selectedColor
              ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-dark-100"
              : "opacity-80 hover:opacity-100"
          }`}
        >
          <HiXMark className="h-3.5 w-3.5 text-light-700 dark:text-dark-800" />
        </button>
        {colours.map((c) => {
          const isSelected = selectedColor === c.code;
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => onChange(c.code)}
              title={c.name}
              style={{ backgroundColor: c.code }}
              className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-all hover:scale-105 focus:outline-none ${
                isSelected
                  ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-dark-100"
                  : "opacity-85 hover:opacity-100"
              }`}
            >
              {isSelected && <HiCheck className="h-4 w-4 text-white drop-shadow" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
