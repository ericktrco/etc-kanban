import { useCallback } from "react";
import { t } from "@lingui/core/macro";

interface Board {
  publicId: string;
  name: string;
}

interface ReportBoardFilterProps {
  boards: Board[];
  selectedBoardIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onClose: () => void;
}

export default function ReportBoardFilter({
  boards,
  selectedBoardIds,
  onSelectionChange,
  onClose,
}: ReportBoardFilterProps) {
  const handleToggle = useCallback(
    (boardPublicId: string) => {
      if (selectedBoardIds.includes(boardPublicId)) {
        onSelectionChange(
          selectedBoardIds.filter((id) => id !== boardPublicId),
        );
      } else {
        onSelectionChange([...selectedBoardIds, boardPublicId]);
      }
    },
    [selectedBoardIds, onSelectionChange],
  );

  const handleSelectAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  return (
    <div className="border-b border-light-300 bg-light-50 px-6 py-3 dark:border-dark-300 dark:bg-dark-50 md:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-light-800 dark:text-dark-800">
          {t`Filter by board`}:
        </span>
        <button
          type="button"
          onClick={handleSelectAll}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
            selectedBoardIds.length === 0
              ? "border border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              : "border border-light-200 bg-light-50 text-neutral-700 hover:border-light-400 dark:border-dark-300 dark:bg-dark-100 dark:text-dark-900 dark:hover:border-dark-500"
          }`}
        >
          {t`All Boards`}
        </button>
        {boards.map((board) => (
          <button
            key={board.publicId}
            type="button"
            onClick={() => handleToggle(board.publicId)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
              selectedBoardIds.includes(board.publicId)
                ? "border border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                : "border border-light-200 bg-light-50 text-neutral-700 hover:border-light-400 dark:border-dark-300 dark:bg-dark-100 dark:text-dark-900 dark:hover:border-dark-500"
            }`}
          >
            {board.name}
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
