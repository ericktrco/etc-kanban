import { useCallback } from "react";
import { t } from "@lingui/core/macro";

interface ListInfo {
  publicId: string;
  name: string;
  boardName: string;
}

interface ReportListFilterProps {
  lists: ListInfo[];
  selectedListIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
}

export default function ReportListFilter({
  lists,
  selectedListIds,
  onSelectionChange,
  onClose,
}: ReportListFilterProps) {
  const handleToggle = useCallback(
    (listPublicId: string) => {
      if (selectedListIds.includes(listPublicId)) {
        onSelectionChange(
          selectedListIds.filter((id) => id !== listPublicId),
        );
      } else {
        onSelectionChange([...selectedListIds, listPublicId]);
      }
    },
    [selectedListIds, onSelectionChange],
  );

  const handleSelectAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  return (
    <div className="border-b border-light-300 bg-light-50 px-6 py-3 dark:border-dark-300 dark:bg-dark-50 md:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-light-800 dark:text-dark-800">
          {t`Filter by List/Column`}:
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
            selectedListIds.length === 0
              ? "border border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              : "border border-light-200 bg-light-50 text-neutral-700 hover:border-light-400 dark:border-dark-300 dark:bg-dark-100 dark:text-dark-900 dark:hover:border-dark-500"
          }`}
        >
          {t`All Lists`}
        </button>
        {lists.map((list) => (
          <button
            key={list.publicId}
            type="button"
            onClick={() => handleToggle(list.publicId)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              selectedListIds.includes(list.publicId)
                ? "border border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "border border-light-200 bg-light-50 text-neutral-700 hover:border-light-400 dark:border-dark-300 dark:bg-dark-100 dark:text-dark-900 dark:hover:border-dark-500"
            }`}
          >
            {list.name} <span className="text-[10px] opacity-60">({list.boardName})</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-xs font-medium text-light-700 hover:text-neutral-900 dark:text-dark-700 dark:hover:text-dark-1000"
        >
          {t`Close`}
        </button>
      </div>
    </div>
  );
}
