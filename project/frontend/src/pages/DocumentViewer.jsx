import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Loading from "../components/Loading";

import {
  getDocument,
  getDocumentPdf
} from "../services/api";


const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".tiff",
  ".tif"
];


export default function DocumentViewer() {

  const {
    documentId
  } = useParams();

  const navigate =
    useNavigate();


  // =====================================================
  // State
  // =====================================================

  const [
    document,
    setDocument
  ] = useState(null);


  const [
    pdfUrl,
    setPdfUrl
  ] = useState("");


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    error,
    setError
  ] = useState("");


  // =====================================================
  // Load document
  // =====================================================

  useEffect(() => {

    let cancelled = false;


    async function load() {

      try {

        setLoading(true);
        setError("");
        setPdfUrl("");


        // -----------------------------------------------
        // Get document metadata
        // -----------------------------------------------

        const result =
          await getDocument(
            documentId
          );


        if (cancelled) {
          return;
        }


        const currentDocument =
          result.document;


        setDocument(
          currentDocument
        );


        // -----------------------------------------------
        // PDF
        // -----------------------------------------------

        if (
          currentDocument?.extension
            ?.toLowerCase() === ".pdf"
        ) {

          /*
           * getDocumentPdf() first authenticates with
           * FastAPI and then returns the Cloudinary URL.
           *
           * It does NOT create a Blob URL anymore.
           */

          const url =
            await getDocumentPdf(
              documentId
            );


          if (cancelled) {
            return;
          }


          setPdfUrl(
            url
          );
        }

      } catch (err) {

        console.error(
          "Document loading error:",
          err
        );


        if (!cancelled) {

          setError(
            err.message ||
            "Unable to load document"
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }
    }


    if (documentId) {

      load();

    }


    // ===================================================
    // Cleanup
    // ===================================================

    return () => {

      cancelled = true;

    };

  }, [documentId]);


  // =====================================================
  // Render viewer
  // =====================================================

  function renderViewer() {

    if (!document) {

      return null;

    }


    const extension =
      document.extension
        ?.toLowerCase();


    // ===================================================
    // PDF
    // ===================================================

    if (extension === ".pdf") {

      if (!pdfUrl) {

        return (
          <Loading
            text="Loading PDF..."
          />
        );

      }


      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* ------------------------------------------- */}
          {/* PDF Header */}
          {/* ------------------------------------------- */}

          <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-4">

            <div>

              <p className="text-sm font-semibold text-slate-800">

                PDF Preview

              </p>


              <p className="text-xs text-slate-500">

                Secure document viewer

              </p>

            </div>


            {/* ----------------------------------------- */}
            {/* Open PDF */}
            {/* ----------------------------------------- */}

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >

              Open PDF

            </a>

          </div>


          {/* ------------------------------------------- */}
          {/* PDF Viewer */}
          {/* ------------------------------------------- */}

          <iframe
            src={pdfUrl}
            title={document.file_name}
            className="h-[80vh] w-full"
          />

        </div>
      );

    }


    // ===================================================
    // Images
    // ===================================================

    if (
      IMAGE_EXTENSIONS.includes(
        extension
      )
    ) {

      return (
        <div className="flex min-h-[70vh] items-center justify-center rounded-2xl border bg-gray-50 p-5">

          <img
            src={
              document.cloudinary_url
            }
            alt={
              document.file_name
            }
            className="max-h-[75vh] max-w-full rounded-lg object-contain"
          />

        </div>
      );

    }


    // ===================================================
    // Other files
    // ===================================================

    return (
      <div className="rounded-2xl border bg-white p-10 text-center">

        <p className="mb-5 text-gray-600">

          This file type cannot be previewed
          directly in the browser.

        </p>


        <a
          href={
            document.cloudinary_url
          }
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-black px-5 py-3 text-white transition hover:bg-gray-800"
        >

          Open / Download File

        </a>

      </div>
    );
  }


  // =====================================================
  // Page
  // =====================================================

  return (

    <div className="min-h-screen bg-gray-50">

      {/* ----------------------------------------------- */}
      {/* Navbar */}
      {/* ----------------------------------------------- */}

      <Navbar />


      {/* ----------------------------------------------- */}
      {/* Main */}
      {/* ----------------------------------------------- */}

      <main className="mx-auto max-w-7xl p-6">

        {/* --------------------------------------------- */}
        {/* Back button */}
        {/* --------------------------------------------- */}

        <button
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
          className="mb-5 text-sm text-gray-500 transition hover:text-black"
        >

          ← Back to Dashboard

        </button>


        {/* --------------------------------------------- */}
        {/* Loading */}
        {/* --------------------------------------------- */}

        {loading ? (

          <Loading
            text="Loading document..."
          />

        ) : error ? (

          /* ------------------------------------------- */
          /* Error */
          /* ------------------------------------------- */

          <div className="rounded-xl bg-red-50 p-5 text-red-600">

            {error}

          </div>

        ) : (

          /* ------------------------------------------- */
          /* Document */
          /* ------------------------------------------- */

          <>

            {/* ----------------------------------------- */}
            {/* Document information */}
            {/* ----------------------------------------- */}

            <div className="mb-6">

              <h1 className="break-all text-2xl font-bold">

                {document.file_name}

              </h1>


              <p className="mt-1 text-sm text-gray-500">

                Document preview

              </p>

            </div>


            {/* ----------------------------------------- */}
            {/* Viewer */}
            {/* ----------------------------------------- */}

            {renderViewer()}

          </>

        )}

      </main>

    </div>

  );
}