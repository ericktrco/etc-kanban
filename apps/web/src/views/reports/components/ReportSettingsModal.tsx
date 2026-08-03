import { useState, useCallback, useRef } from "react";
import { t } from "@lingui/core/macro";
import { HiOutlinePhoto, HiOutlineXMark } from "react-icons/hi2";

import Button from "~/components/Button";

interface ReportSettings {
  companyName: string;
  companyLogo: string;
  employeeName: string;
  position: string;
  workingTime: string;
}

interface ReportSettingsModalProps {
  settings: ReportSettings;
  onSave: (settings: ReportSettings) => void;
  onClose: () => void;
}

export default function ReportSettingsModal({
  settings,
  onSave,
  onClose,
}: ReportSettingsModalProps) {
  const [form, setForm] = useState<ReportSettings>({ ...settings });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (field: keyof ReportSettings, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        return; // Max 2MB
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          setForm((prev) => ({ ...prev, companyLogo: result }));
        }
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleRemoveLogo = useCallback(() => {
    setForm((prev) => ({ ...prev, companyLogo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave(form);
    },
    [form, onSave],
  );

  const inputClass =
    "w-full rounded-md border border-light-300 bg-light-50 px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-400 dark:bg-dark-100 dark:text-dark-1000";

  const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-light-800 dark:text-dark-800";

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-neutral-900 dark:text-dark-1000">
          {t`Report Settings`}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-light-700 transition-colors hover:bg-light-200 hover:text-neutral-900 dark:text-dark-700 dark:hover:bg-dark-200 dark:hover:text-dark-1000"
        >
          <HiOutlineXMark className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Company Name */}
        <div>
          <label htmlFor="report-company-name" className={labelClass}>
            {t`Company Name`}
          </label>
          <input
            id="report-company-name"
            type="text"
            value={form.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            className={inputClass}
            placeholder={t`Enter company name`}
          />
        </div>

        {/* Company Logo */}
        <div>
          <label className={labelClass}>{t`Company Logo`}</label>
          <div className="flex items-center gap-3">
            {form.companyLogo ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-md border border-light-300 dark:border-dark-400">
                <img
                  src={form.companyLogo}
                  alt="Logo preview"
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white shadow-sm hover:bg-red-600"
                >
                  <HiOutlineXMark className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-dashed border-light-300 text-light-500 dark:border-dark-400 dark:text-dark-600">
                <HiOutlinePhoto className="h-6 w-6" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="report-logo-upload"
              />
              <label
                htmlFor="report-logo-upload"
                className="cursor-pointer rounded-md border border-light-300 bg-light-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:bg-light-200 dark:border-dark-400 dark:bg-dark-100 dark:text-dark-900 dark:hover:bg-dark-200"
              >
                {form.companyLogo ? t`Change Logo` : t`Upload Logo`}
              </label>
              <p className="mt-1 text-[10px] text-light-600 dark:text-dark-600">
                {t`Max 2MB. PNG, JPG recommended.`}
              </p>
            </div>
          </div>
        </div>

        {/* Employee Name */}
        <div>
          <label htmlFor="report-employee-name" className={labelClass}>
            {t`Employee Name`}
          </label>
          <input
            id="report-employee-name"
            type="text"
            value={form.employeeName}
            onChange={(e) => handleChange("employeeName", e.target.value)}
            className={inputClass}
            placeholder={t`Enter employee name`}
          />
        </div>

        {/* Position */}
        <div>
          <label htmlFor="report-position" className={labelClass}>
            {t`Position / Title`}
          </label>
          <input
            id="report-position"
            type="text"
            value={form.position}
            onChange={(e) => handleChange("position", e.target.value)}
            className={inputClass}
            placeholder={t`Enter position or title`}
          />
        </div>

        {/* Working Time */}
        <div>
          <label htmlFor="report-working-time" className={labelClass}>
            {t`Working Time`}
          </label>
          <textarea
            id="report-working-time"
            value={form.workingTime}
            onChange={(e) => handleChange("workingTime", e.target.value)}
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder={t`e.g. 8:00 AM\nTO\n6:00 PM`}
          />
          <p className="mt-1 text-[10px] text-light-600 dark:text-dark-600">
            {t`Use new lines for formatting (e.g. "8:00 AM", "TO", "6:00 PM")`}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} type="button">
          {t`Cancel`}
        </Button>
        <Button type="submit">{t`Save Settings`}</Button>
      </div>
    </form>
  );
}
