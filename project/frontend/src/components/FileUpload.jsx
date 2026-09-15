import {
  useRef,
  useState
} from "react";

import {
  uploadDocuments
} from "../services/api";


const ACCEPTED = [
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".xls",
  ".csv",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".tiff",
  ".tif"
];


export default function FileUpload({
  onUploaded
}) {

  const inputRef =
    useRef(null);

  const [files, setFiles] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");


  function handleFiles(event) {

    const selected =
      Array.from(
        event.target.files || []
      );

    setFiles(selected);
    setMessage("");
  }


  async function handleUpload() {

    if (!files.length) {
      setMessage(
        "Please select files first."
      );
      return;
    }

    try {

      setLoading(true);

      const result =
        await uploadDocuments(
          files
        );

      const success =
        result.results.filter(
          item =>
            item.status ===
            "success"
        ).length;

      const duplicate =
        result.results.filter(
          item =>
            item.status ===
            "duplicate"
        ).length;

      setMessage(
        `${success} file(s) uploaded. ` +
        `${duplicate} duplicate(s).`
      );

      setFiles([]);

      if (inputRef.current) {
        inputRef.current.value =
          "";
      }

      onUploaded?.();

    } catch (error) {

      setMessage(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h2 className="mb-2 text-lg font-semibold">
        Upload Documents
      </h2>

      <p className="mb-4 text-sm text-gray-500">
        PDF, Word, PPTX, Excel, CSV,
        TXT and image files are supported.
      </p>


      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED.join(",")}
        onChange={handleFiles}
        className="block w-full rounded-lg border p-3"
      />


      {files.length > 0 && (
        <div className="mt-4 space-y-2">

          {files.map(
            (file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="rounded-lg bg-gray-50 p-3 text-sm"
              >
                {file.name}
              </div>
            )
          )}

        </div>
      )}


      <button
        onClick={handleUpload}
        disabled={
          loading ||
          files.length === 0
        }
        className="mt-5 rounded-lg bg-black px-5 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : "Upload & Process"}
      </button>


      {message && (
        <p className="mt-4 text-sm text-gray-600">
          {message}
        </p>
      )}

    </div>
  );
}