import { useRef, useState } from "react";
import {
  CloudUpload,
  File,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { uploadDocuments } from "../services/api";

const ACCEPTED =
  ".pdf,.docx,.pptx,.xlsx,.xls,.csv,.txt,.jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif";

export default function FileUpload({ onUploaded }) {
  const input = useRef();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const select = (e) => {
    setFiles(Array.from(e.target.files || []));
    setMessage("");
  };

  const upload = async () => {
    if (!files.length) return;

    try {
      setLoading(true);
      setMessage("");

      const result = await uploadDocuments(files);

      const success = result.results.filter(
        (x) => x.status === "success"
      ).length;

      const duplicate = result.results.filter(
        (x) => x.status === "duplicate"
      ).length;

      setMessage(`${success} uploaded · ${duplicate} duplicate`);

      setFiles([]);

      if (input.current) {
        input.current.value = "";
      }

      onUploaded?.();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index) => {
    setFiles((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="w-full">

      {/* =====================================================
          UPLOAD BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CloudUpload size={18} />

        {loading ? "Processing..." : "Upload Document"}
      </button>


      {/* =====================================================
          HIDDEN FILE INPUT
      ===================================================== */}

      <input
        ref={input}
        hidden
        type="file"
        multiple
        accept={ACCEPTED}
        onChange={select}
      />


      {/* =====================================================
          SELECTED FILES
      ===================================================== */}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">

          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >

              <File
                size={15}
                className="shrink-0 text-indigo-500"
              />

              <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
                {file.name}
              </span>

              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={14} />
              </button>

            </div>
          ))}


          {/* =================================================
              UPLOAD & INDEX
          ================================================= */}

          <button
            type="button"
            onClick={upload}
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing with AI..."
              : `Upload & index ${files.length} file(s)`}
          </button>

        </div>
      )}


      {/* =====================================================
          SUCCESS / ERROR MESSAGE
      ===================================================== */}

      {message && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2">

          <CheckCircle2
            size={14}
            className="mt-0.5 shrink-0 text-emerald-600"
          />

          <p className="text-xs text-emerald-700">
            {message}
          </p>

        </div>
      )}

    </div>
  );
}