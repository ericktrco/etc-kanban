import { t } from "@lingui/core/macro";
import html2canvas from "html2canvas";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiOutlineArrowDownTray,
  HiOutlineCalendarDays,
  HiOutlineCog6Tooth,
  HiOutlineDocumentDuplicate,
  HiOutlineFunnel,
} from "react-icons/hi2";

import { stripHtml } from "@kan/shared";

import Button from "~/components/Button";
import Modal from "~/components/modal";
import { PageHead } from "~/components/PageHead";
import { usePopup } from "~/providers/popup";
import { useWorkspace } from "~/providers/workspace";
import { api } from "~/utils/api";
import ReportBoardFilter from "./components/ReportBoardFilter";
import ReportListFilter from "./components/ReportListFilter";
import ReportSettingsModal from "./components/ReportSettingsModal";

interface ReportSettings {
  companyName: string;
  companyLogo: string;
  employeeName: string;
  position: string;
  workingTime: string;
}

interface ColumnVisibility {
  employeeName: boolean;
  position: boolean;
  date: boolean;
  workLocation: boolean;
  workAccomplished: boolean;
  cardDescription: boolean;
  totalWorkingTime: boolean;
}

const DEFAULT_SETTINGS: ReportSettings = {
  companyName: "Erick Trading Co.",
  companyLogo: "",
  employeeName: "",
  position: "",
  workingTime: "8:00 AM\nTO\n6:00 PM",
};

const DEFAULT_COLUMNS: ColumnVisibility = {
  employeeName: true,
  position: true,
  date: true,
  workLocation: true,
  workAccomplished: true,
  cardDescription: true,
  totalWorkingTime: true,
};

const STORAGE_KEY_SETTINGS = "kan_report_settings";
const STORAGE_KEY_COLUMNS = "kan_report_columns";

function loadSettings(): ReportSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function loadColumns(): ColumnVisibility {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COLUMNS);
    if (saved) return { ...DEFAULT_COLUMNS, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return DEFAULT_COLUMNS;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ReportView() {
  const { workspace } = useWorkspace();
  const { showPopup } = usePopup();
  const reportRef = useRef<HTMLDivElement>(null);

  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [settings, setSettings] = useState<ReportSettings>(loadSettings);
  const [columns, setColumns] = useState<ColumnVisibility>(loadColumns);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBoardFilter, setShowBoardFilter] = useState(false);
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([]);
  const [showListFilter, setShowListFilter] = useState(false);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Compute start/end of day in local timezone for exact report date bounds
  const localStartDate = new Date(
    reportDate.getFullYear(),
    reportDate.getMonth(),
    reportDate.getDate(),
    0,
    0,
    0,
    0,
  );
  const localEndDate = new Date(
    reportDate.getFullYear(),
    reportDate.getMonth(),
    reportDate.getDate(),
    23,
    59,
    59,
    999,
  );

  // Fetch report data
  const {
    data: reportData,
    isLoading,
    refetch,
  } = api.report.generateReport.useQuery(
    {
      workspacePublicId: workspace.publicId,
      date: reportDate.toISOString(),
      startDate: localStartDate.toISOString(),
      endDate: localEndDate.toISOString(),
      boardPublicIds: selectedBoardIds.length ? selectedBoardIds : undefined,
      listPublicIds: selectedListIds.length ? selectedListIds : undefined,
    },
    {
      enabled: !!workspace.publicId && workspace.publicId.length >= 12,
    },
  );

  // Fetch boards for filter
  const { data: boardsData } = api.report.getBoards.useQuery(
    {
      workspacePublicId: workspace.publicId,
    },
    {
      enabled: !!workspace.publicId && workspace.publicId.length >= 12,
    },
  );

  // Fetch lists for column filter
  const { data: listsData } = api.report.getLists.useQuery(
    {
      workspacePublicId: workspace.publicId,
    },
    {
      enabled: !!workspace.publicId && workspace.publicId.length >= 12,
    },
  );

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(columns));
  }, [columns]);

  const handleSaveSettings = useCallback(
    (newSettings: ReportSettings) => {
      setSettings(newSettings);
      setShowSettingsModal(false);
      showPopup({
        header: t`Settings saved`,
        message: t`Report settings have been updated.`,
        icon: "success",
      });
    },
    [showPopup],
  );

  const handleColumnToggle = useCallback((key: keyof ColumnVisibility) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      const dateStr = toInputDate(reportDate);
      link.download = `Daily_Work_Report_${dateStr}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showPopup({
        header: t`Report downloaded`,
        message: t`The report image has been saved.`,
        icon: "success",
      });
    } catch {
      showPopup({
        header: t`Download failed`,
        message: t`Unable to generate the report image.`,
        icon: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [reportDate, showPopup]);

  const handleCopyImage = useCallback(async () => {
    if (!reportRef.current) return;
    setIsCopying(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showPopup({
            header: t`Copy failed`,
            message: t`Unable to generate report image.`,
            icon: "error",
          });
          setIsCopying(false);
          return;
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob }),
          ]);
          showPopup({
            header: t`Copied to clipboard`,
            message: t`The report image has been copied to your clipboard.`,
            icon: "success",
          });
        } catch {
          showPopup({
            header: t`Copy failed`,
            message: t`Your browser may not support copying images directly to the clipboard.`,
            icon: "error",
          });
        } finally {
          setIsCopying(false);
        }
      }, "image/png");
    } catch {
      showPopup({
        header: t`Copy failed`,
        message: t`Unable to generate the report image.`,
        icon: "error",
      });
      setIsCopying(false);
    }
  }, [showPopup]);

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val) {
        const [year, month, day] = val.split("-").map(Number);
        setReportDate(new Date(year!, month! - 1, day));
      }
    },
    [],
  );

  return (
    <>
      <PageHead title={`${t`Reports`} | ${workspace.name ?? t`Workspace`}`} />
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-light-300 p-6 dark:border-dark-300 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h1 className="text-[1.2rem] font-bold tracking-tight text-neutral-900 dark:text-dark-1000">
              {t`Daily Work Report`}
            </h1>
            <p className="mt-1 text-sm text-light-900 dark:text-dark-800">
              {t`Generate and download your daily work accomplishment report`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <HiOutlineCalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-800 dark:text-dark-800" />
              <input
                type="date"
                value={toInputDate(reportDate)}
                onChange={handleDateChange}
                className="rounded-md border border-light-300 bg-light-50 py-2 pl-9 pr-3 text-sm text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-300 dark:bg-dark-100 dark:text-dark-1000"
              />
            </div>
            <Button
              iconLeft={<HiOutlineFunnel className="h-4 w-4" />}
              onClick={() => {
                setShowBoardFilter(!showBoardFilter);
                if (!showBoardFilter) setShowListFilter(false);
              }}
              variant="secondary"
            >
              {t`Boards`}
              {selectedBoardIds.length > 0 && (
                <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {selectedBoardIds.length}
                </span>
              )}
            </Button>
            <Button
              iconLeft={<HiOutlineFunnel className="h-4 w-4" />}
              onClick={() => {
                setShowListFilter(!showListFilter);
                if (!showListFilter) setShowBoardFilter(false);
              }}
              variant="secondary"
            >
              {t`Board Lists`}
              {selectedListIds.length > 0 && (
                <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {selectedListIds.length}
                </span>
              )}
            </Button>
            <Button
              iconLeft={<HiOutlineCog6Tooth className="h-4 w-4" />}
              onClick={() => setShowSettingsModal(true)}
              variant="secondary"
            >
              {t`Settings`}
            </Button>
            <Button
              iconLeft={<HiOutlineDocumentDuplicate className="h-4 w-4" />}
              onClick={handleCopyImage}
              variant="secondary"
              disabled={
                isCopying || isDownloading || isLoading || !reportData?.boards.length
              }
            >
              {isCopying ? t`Copying...` : t`Copy as Image`}
            </Button>
            <Button
              iconLeft={<HiOutlineArrowDownTray className="h-4 w-4" />}
              onClick={handleDownload}
              disabled={
                isDownloading || isCopying || isLoading || !reportData?.boards.length
              }
            >
              {isDownloading ? t`Downloading...` : t`Download as Image`}
            </Button>
          </div>
        </div>

        {/* Board filter dropdown */}
        {showBoardFilter && boardsData && (
          <ReportBoardFilter
            boards={boardsData}
            selectedBoardIds={selectedBoardIds}
            onSelectionChange={setSelectedBoardIds}
            onClose={() => setShowBoardFilter(false)}
          />
        )}

        {/* List filter dropdown */}
        {showListFilter && listsData && (
          <ReportListFilter
            lists={listsData}
            selectedListIds={selectedListIds}
            onSelectionChange={setSelectedListIds}
            onClose={() => setShowListFilter(false)}
          />
        )}

        {/* Column visibility toggles */}
        <div className="flex flex-wrap items-center gap-3 border-b border-light-300 px-6 py-3 dark:border-dark-300 md:px-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-light-800 dark:text-dark-800">
            {t`Columns`}:
          </span>
          {(
            [
              { key: "employeeName", label: t`Employee Name` },
              { key: "position", label: t`Position` },
              { key: "date", label: t`Date` },
              { key: "workLocation", label: t`Work Location` },
              { key: "workAccomplished", label: t`Work Accomplished` },
              { key: "cardDescription", label: t`Card Description` },
              { key: "totalWorkingTime", label: t`Total Working Time` },
            ] as { key: keyof ColumnVisibility; label: string }[]
          ).map((col) => (
            <label
              key={col.key}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-light-200 bg-light-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-all hover:border-light-400 dark:border-dark-300 dark:bg-dark-100 dark:text-dark-900 dark:hover:border-dark-500"
            >
              <input
                type="checkbox"
                checked={columns[col.key]}
                onChange={() => handleColumnToggle(col.key)}
                className="h-3.5 w-3.5 rounded border-light-400 text-blue-500 focus:ring-blue-500 dark:border-dark-500"
              />
              {col.label}
            </label>
          ))}
        </div>

        {/* Report preview area */}
        <div className="flex-1 overflow-auto bg-light-200 p-4 dark:bg-dark-200 md:p-8">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-light-400 border-t-blue-500" />
            </div>
          ) : !reportData?.boards.length ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <HiOutlineCalendarDays className="h-12 w-12 text-light-500 dark:text-dark-600" />
              <p className="mt-4 text-sm font-medium text-light-800 dark:text-dark-800">
                {t`No activity found for this date`}
              </p>
              <p className="mt-1 text-xs text-light-700 dark:text-dark-700">
                {t`Try selecting a different date or adjusting your board filters`}
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-[850px]">
              {/* The actual report that will be captured as PNG */}
              <div
                ref={reportRef}
                className="overflow-hidden rounded-lg bg-white shadow-lg"
                style={{
                  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                }}
              >
                <ReportDocument
                  settings={settings}
                  columns={columns}
                  reportDate={reportDate}
                  boards={reportData.boards}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal modalSize="md" isVisible={showSettingsModal}>
        <ReportSettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Report Document (the HTML that becomes the PNG)                     */
/* ------------------------------------------------------------------ */

function ReportDocument({
  settings,
  columns,
  reportDate,
  boards,
}: {
  settings: ReportSettings;
  columns: ColumnVisibility;
  reportDate: Date;
  boards: {
    name: string;
    publicId: string;
    cards: { title: string; description?: string | null; publicId: string }[];
  }[];
}) {
  const dateStr = formatDate(reportDate);
  const dayStr = formatDay(reportDate);

  return (
    <div style={{ padding: "0", backgroundColor: "#ffffff", color: "#000000" }}>
      <style>{`
        .report-card-description p {
          margin: 2px 0;
        }
        .report-card-description ul {
          list-style-type: disc !important;
          padding-left: 18px !important;
          margin: 4px 0 !important;
        }
        .report-card-description ol {
          list-style-type: decimal !important;
          padding-left: 18px !important;
          margin: 4px 0 !important;
        }
        .report-card-description li {
          display: list-item !important;
          margin-bottom: 2px !important;
        }
        .report-card-description strong, .report-card-description b {
          font-weight: 600 !important;
        }
        .report-card-description em, .report-card-description i {
          font-style: italic !important;
        }
        .report-card-description blockquote {
          border-left: 2px solid #d1d5db;
          padding-left: 8px;
          margin: 4px 0;
          color: #6b7280;
        }
        .report-card-description code {
          background-color: #f3f4f6;
          padding: 1px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 10px;
        }
      `}</style>

      {/* Company Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 32px 16px 32px",
          borderBottom: "2px solid #000000",
        }}
      >
        {settings.companyLogo && (
          <img
            src={settings.companyLogo}
            alt="Company Logo"
            style={{
              width: 60,
              height: 60,
              objectFit: "contain",
              marginRight: 16,
            }}
          />
        )}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.02em",
            textAlign: "center",
          }}
        >
          {settings.companyName}
        </div>
      </div>

      {/* Employee Info Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
        }}
      >
        <tbody>
          {columns.employeeName && (
            <tr>
              <td
                style={{
                  padding: "6px 16px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid #d1d5db",
                  width: "160px",
                }}
              >
                EMPLOYEE NAME:
              </td>
              <td
                style={{
                  padding: "6px 16px",
                  fontWeight: 600,
                  borderBottom: "1px solid #d1d5db",
                }}
              >
                {settings.employeeName}
              </td>
              {columns.date && (
                <td
                  style={{
                    padding: "6px 16px",
                    fontWeight: 700,
                    textAlign: "right",
                    borderBottom: "1px solid #d1d5db",
                  }}
                >
                  {dateStr}
                </td>
              )}
            </tr>
          )}
          {columns.position && (
            <tr>
              <td
                style={{
                  padding: "6px 16px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid #d1d5db",
                }}
              >
                POSITION:
              </td>
              <td
                style={{
                  padding: "6px 16px",
                  fontWeight: 600,
                  borderBottom: "1px solid #d1d5db",
                }}
              >
                {settings.position}
              </td>
              {columns.date && (
                <td
                  style={{
                    padding: "6px 16px",
                    fontWeight: 700,
                    textAlign: "right",
                    borderBottom: "1px solid #d1d5db",
                  }}
                >
                  {dayStr}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>

      {/* Main Report Table Header */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
          marginTop: 0,
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#e5e7eb",
            }}
          >
            {columns.workLocation && (
              <th
                style={{
                  padding: "10px 16px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  textAlign: "center",
                  borderBottom: "2px solid #000000",
                  borderRight: "1px solid #d1d5db",
                  width: "150px",
                }}
              >
                WORK LOCATION
              </th>
            )}
            {columns.workAccomplished && (
              <th
                style={{
                  padding: "10px 16px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  textAlign: "center",
                  borderBottom: "2px solid #000000",
                  borderRight: columns.totalWorkingTime
                    ? "1px solid #d1d5db"
                    : "none",
                }}
              >
                WORK ACCOMPLISHED
              </th>
            )}
            {columns.totalWorkingTime && (
              <th
                style={{
                  padding: "10px 16px",
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: "uppercase",
                  textAlign: "center",
                  borderBottom: "2px solid #000000",
                  width: "150px",
                }}
              >
                TOTAL WORKING TIME
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {boards.map((board, boardIndex) => (
            <tr key={board.publicId}>
              {columns.workLocation && (
                <td
                  style={{
                    padding: "12px 16px",
                    fontWeight: 700,
                    textAlign: "center",
                    verticalAlign: "middle",
                    borderBottom: "1px solid #e5e7eb",
                    borderRight: "1px solid #d1d5db",
                    textTransform: "uppercase",
                    fontSize: 11,
                  }}
                >
                  {board.name}
                </td>
              )}
              {columns.workAccomplished && (
                <td
                  style={{
                    padding: "8px 16px",
                    verticalAlign: "top",
                    borderBottom: "1px solid #e5e7eb",
                    borderRight: columns.totalWorkingTime
                      ? "1px solid #d1d5db"
                      : "none",
                  }}
                >
                  {board.cards.map((card, cardIndex) => (
                    <div
                      key={card.publicId}
                      style={{
                        padding: "6px 0",
                        borderBottom:
                          cardIndex < board.cards.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{card.title}</div>
                      {columns.cardDescription &&
                        stripHtml(card.description ?? "").trim() && (
                          <div
                            className="report-card-description"
                            dangerouslySetInnerHTML={{
                              __html: card.description ?? "",
                            }}
                            style={{
                              fontSize: 11,
                              color: "#4b5563",
                              marginTop: "4px",
                              lineHeight: 1.5,
                            }}
                          />
                        )}
                    </div>
                  ))}
                </td>
              )}
              {columns.totalWorkingTime && boardIndex === 0 && (
                <td
                  rowSpan={boards.length}
                  style={{
                    padding: "12px 16px",
                    fontWeight: 700,
                    textAlign: "center",
                    verticalAlign: "middle",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 12,
                    whiteSpace: "pre-line",
                    lineHeight: 1.8,
                  }}
                >
                  {settings.workingTime}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
