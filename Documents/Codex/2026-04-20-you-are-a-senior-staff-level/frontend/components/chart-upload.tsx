"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

export function ChartUpload({
  onFileChange,
  isDark = false
}: {
  onFileChange: (file: File | null, previewUrl: string | null) => void;
  isDark?: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("Upload chart image");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(file: File | null) {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);
    setFileName(file.name);
    onFileChange(file, nextPreview);
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName("Upload chart image");
    onFileChange(null, null);
  }

  return (
    <div className="space-y-2">
      <label
        className={`flex cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-sm backdrop-blur-xl transition hover:-translate-y-0.5 ${
          isDark
            ? "bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
            : "bg-white/65 text-slate-700 hover:bg-white/90"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <ImagePlus className="h-4 w-4" />
          {fileName}
        </span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => handleChange(event.target.files?.[0] ?? null)} />
      </label>

      {previewUrl ? (
        <div className={`chart-glass-card relative overflow-hidden p-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
          <img src={previewUrl} alt="Uploaded chart preview" className="h-28 w-full rounded object-cover" />
          <button
            type="button"
            onClick={clearFile}
            className={`absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-xl shadow-sm ${
              isDark ? "bg-slate-950/80 text-slate-100" : "bg-white/80 text-slate-700"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
