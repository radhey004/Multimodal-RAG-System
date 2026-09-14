import {
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import Navbar from "../components/Navbar";
import FileUpload from "../components/FileUpload";
import FileCard from "../components/FileCard";
import ChatBox from "../components/ChatBox";
import Loading from "../components/Loading";

import {
  getDocuments
} from "../services/api";


export default function Dashboard() {

  const navigate =
    useNavigate();

  const [documents, setDocuments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  async function loadDocuments() {

    try {

      setLoading(true);

      const result =
        await getDocuments();

      setDocuments(
        result.documents
      );

    } catch (error) {

      if (
        error.message
          .toLowerCase()
          .includes("token")
      ) {

        localStorage.removeItem(
          "token"
        );

        navigate(
          "/login"
        );
      }

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {

    if (
      !localStorage.getItem(
        "token"
      )
    ) {

      navigate(
        "/login"
      );

      return;
    }

    loadDocuments();

  }, []);


  function openDocument(
    document
  ) {

    navigate(
      `/documents/${document.document_id}`
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />


      <main className="mx-auto max-w-7xl space-y-8 p-6">

        <div>

          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="mt-1 text-gray-500">
            Upload documents and ask questions using AI.
          </p>

        </div>


        <FileUpload
          onUploaded={
            loadDocuments
          }
        />


        <div className="grid gap-8 lg:grid-cols-2">

          <section>

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-xl font-semibold">
                Your Documents
              </h2>

              <span className="rounded-full bg-gray-200 px-3 py-1 text-sm">
                {documents.length}
              </span>

            </div>


            {loading ? (

              <Loading
                text="Loading documents..."
              />

            ) : documents.length === 0 ? (

              <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
                No documents uploaded yet.
              </div>

            ) : (

              <div className="space-y-4">

                {documents.map(
                  document => (

                    <FileCard
                      key={
                        document.document_id
                      }
                      document={
                        document
                      }
                      onChanged={
                        loadDocuments
                      }
                      onOpen={
                        openDocument
                      }
                    />

                  )
                )}

              </div>

            )}

          </section>


          <section>

            <ChatBox />

          </section>

        </div>

      </main>

    </div>
  );
}