import {
  useState
} from "react";

import {
  deleteDocument,
  renameDocument
} from "../services/api";


export default function FileCard({
  document,
  onChanged,
  onOpen
}) {

  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState(
      document.file_name
    );

  const [loading, setLoading] =
    useState(false);


  async function handleRename() {

    if (!name.trim()) {
      return;
    }

    try {

      setLoading(true);

      await renameDocument(
        document.document_id,
        name.trim()
      );

      setEditing(false);

      onChanged?.();

    } catch (error) {

      alert(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }


  async function handleDelete() {

    const confirmed =
      window.confirm(
        `Delete "${document.file_name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {

      setLoading(true);

      await deleteDocument(
        document.document_id
      );

      onChanged?.();

    } catch (error) {

      alert(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }


  const extension =
    document.file_name
      .split(".")
      .pop()
      ?.toUpperCase();


  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <div className="mb-4 flex items-start justify-between">

        <div>

          <div className="mb-2 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-medium">
            {extension}
          </div>


          {editing ? (

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              className="w-full rounded-lg border px-3 py-2"
            />

          ) : (

            <h3 className="break-all font-semibold">
              {document.file_name}
            </h3>

          )}

        </div>

      </div>


      <p className="mb-4 text-xs text-gray-500">
        {document.created_at
          ? new Date(
              document.created_at
            ).toLocaleString()
          : ""}
      </p>


      <div className="flex flex-wrap gap-2">

        <button
          onClick={() =>
            onOpen(document)
          }
          className="rounded-lg bg-black px-3 py-2 text-sm text-white"
        >
          Open
        </button>


        {editing ? (

          <>
            <button
              onClick={handleRename}
              disabled={loading}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Save
            </button>

            <button
              onClick={() =>
                setEditing(false)
              }
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </>

        ) : (

          <button
            onClick={() =>
              setEditing(true)
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Rename
          </button>

        )}


        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
        >
          Delete
        </button>

      </div>

    </div>
  );
}