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
  getDocument
} from "../services/api";


export default function DocumentViewer() {

  const {
    documentId
  } = useParams();

  const navigate =
    useNavigate();

  const [document, setDocument] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    async function load() {

      try {

        const result =
          await getDocument(
            documentId
          );

        setDocument(
          result.document
        );

      } catch (error) {

        setError(
          error.message
        );

      } finally {

        setLoading(false);

      }
    }

    load();

  }, [documentId]);


  function renderViewer() {

    if (!document) {
      return null;
    }

    const extension =
      document.extension
        ?.toLowerCase();


    if (
      extension === ".pdf"
    ) {

      return (
        <iframe
          src={
            document.cloudinary_url
          }
          title={
            document.file_name
          }
          className="h-[80vh] w-full rounded-xl border"
        />
      );
    }


    if (
      [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".bmp",
        ".tiff",
        ".tif"
      ].includes(extension)
    ) {

      return (
        <div className="flex min-h-[70vh] items-center justify-center rounded-xl border bg-gray-50 p-5">

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


    return (
      <div className="rounded-xl border bg-white p-10 text-center">

        <p className="mb-4 text-gray-600">
          This file type cannot be previewed directly in the browser.
        </p>

        <a
          href={
            document.cloudinary_url
          }
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-lg bg-black px-5 py-3 text-white"
        >
          Open / Download File
        </a>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />


      <main className="mx-auto max-w-7xl p-6">

        <button
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
          className="mb-5 text-sm text-gray-500 hover:text-black"
        >
          ← Back to Dashboard
        </button>


        {loading ? (

          <Loading
            text="Loading document..."
          />

        ) : error ? (

          <div className="rounded-xl bg-red-50 p-5 text-red-600">
            {error}
          </div>

        ) : (

          <>

            <div className="mb-6">

              <h1 className="break-all text-2xl font-bold">
                {document.file_name}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Original document stored on Cloudinary
              </p>

            </div>


            {renderViewer()}

          </>

        )}

      </main>

    </div>
  );
}