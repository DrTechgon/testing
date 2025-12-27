"use client";

import { UploadCloud } from "lucide-react";

export default function UploadDropzone({
  onFileSelect,
}: {
  onFileSelect: (file: File) => void;
}) {
  return (
    <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-teal-400 rounded-2xl cursor-pointer bg-teal-50 hover:bg-teal-100 transition">
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadCloud className="w-12 h-12 text-teal-600 mb-3" />
        <p className="mb-2 text-sm text-gray-700">
          <span className="font-semibold">Click to upload</span> or drag & drop
        </p>
        <p className="text-xs text-gray-500">
          PDF, PNG, JPG (Max 10MB)
        </p>
      </div>

      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onFileSelect(e.target.files[0]);
          }
        }}
      />
    </label>
  );
}
