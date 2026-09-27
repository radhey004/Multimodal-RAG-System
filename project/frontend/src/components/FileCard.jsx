import { useState } from "react";
import {
  FileText,
  Pencil,
  Trash2,
  ExternalLink,
  Check,
  X
} from "lucide-react";

import {
  deleteDocument,
  renameDocument
} from "../services/api";

export default function FileCard({
  document,
  onChanged,
  onOpen
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(document.file_name);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      await renameDocument(
        document.document_id,
        name.trim()
      );
      setEditing(false);
      onChanged?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${document.file_name}"?`)) return;

    try {
      setLoading(true);
      await deleteDocument(document.document_id);
      onChanged?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const extension =
    document.file_name
      .split(".")
      .pop()
      ?.toUpperCase();

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex gap-4">
        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          <FileText />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                />
              ) : (
                <h3 className="truncate font-bold">
                  {document.file_name}
                </h3>
              )}

              <div className="mt-1 flex gap-2 text-xs text-slate-400">
                <span>{extension}</span>
                <span>•</span>
                <span>
                  {document.created_at
                    ? new Date(
                        document.created_at
                      ).toLocaleDateString()
                    : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onOpen(document)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
            >
              <ExternalLink size={15} />
              Open
            </button>

            {editing ? (
              <>
                <button
                  onClick={save}
                  disabled={loading}
                  className="rounded-lg border p-2 text-green-600"
                >
                  <Check size={16} />
                </button>

                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border p-2"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg border p-2"
              >
                <Pencil size={16} />
              </button>
            )}

            <button
              onClick={remove}
              disabled={loading}
              className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}