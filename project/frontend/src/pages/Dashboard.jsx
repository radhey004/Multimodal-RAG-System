import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Image,
  Table2,
  ScanText,
  Database,
  MessageSquareText,
  BrainCircuit,
  Search,
  Layers3,
  CheckCircle2,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";

import Navbar from "../components/Navbar";
import FileUpload from "../components/FileUpload";
import FileCard from "../components/FileCard";
import ChatBox from "../components/ChatBox";
import Loading from "../components/Loading";
import { getDocuments } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);

      const result = await getDocuments();

      setDocuments(result.documents || []);
    } catch (error) {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      <Navbar />

      <main className="h-[calc(100vh-64px)] p-4 sm:p-5">
        <div className="mx-auto grid h-full max-w-[1600px] min-h-0 grid-cols-[260px_minmax(0,1fr)_280px] gap-4">

          {/* =====================================================
              LEFT — KNOWLEDGE BASE
          ===================================================== */}

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Header */}

            <div className="shrink-0 border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">

                <div>
                  <div className="flex items-center gap-2">

                    <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                      <Database size={17} />
                    </div>

                    <h2 className="text-sm font-bold">
                      Knowledge Base
                    </h2>

                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Indexed documents
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {documents.length}
                </span>

              </div>
            </div>


            {/* Documents */}

            <div className="min-h-0 flex-1 overflow-y-auto p-3">

              {loading ? (
                <Loading text="Loading..." />
              ) : documents.length ? (

                <div className="space-y-3">

                  {documents.map((document) => (
                    <FileCard
                      key={document.document_id}
                      document={document}
                      onChanged={load}
                      onOpen={(doc) =>
                        navigate(`/documents/${doc.document_id}`)
                      }
                    />
                  ))}

                </div>

              ) : (

                <EmptyKnowledge />

              )}

            </div>


            {/* Upload */}

            <div className="shrink-0 border-t border-slate-200 p-3">
              <FileUpload onUploaded={load} />
            </div>

          </aside>


          {/* =====================================================
              CENTER — LARGE CHATBOX
          ===================================================== */}

          <section className="min-h-0 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <ChatBox />

          </section>


          {/* =====================================================
              RIGHT — RAG INFORMATION
          ===================================================== */}

          <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">

            {/* RAG INFORMATION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    System
                  </p>

                  <h2 className="mt-1 text-sm font-bold">
                    RAG Information
                  </h2>
                </div>

                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  ACTIVE

                </span>

              </div>


              <div className="mt-4 space-y-2">

                <InfoRow
                  label="Documents"
                  value={documents.length}
                />

                <InfoRow
                  label="Retrieval"
                  value="Semantic"
                />

                <InfoRow
                  label="Multimodal"
                  value="Enabled"
                />

                <InfoRow
                  label="Generation"
                  value="Context-aware"
                />

              </div>

            </div>


            {/* RAG PIPELINE */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="mb-4 flex items-center gap-2">

                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <Layers3 size={16} />
                </div>

                <div>

                  <h2 className="text-sm font-bold">
                    RAG Pipeline
                  </h2>

                  <p className="text-[10px] text-slate-400">
                    Retrieval workflow
                  </p>

                </div>

              </div>


              <div className="space-y-2">

                <PipelineStep
                  icon={<FileText size={14} />}
                  title="Documents"
                  subtitle={`${documents.length} indexed`}
                />

                <PipelineLine />

                <PipelineStep
                  icon={<ScanText size={14} />}
                  title="Extraction"
                  subtitle="Text + OCR + tables"
                />

                <PipelineLine />

                <PipelineStep
                  icon={<Database size={14} />}
                  title="Vector Search"
                  subtitle="Semantic retrieval"
                />

                <PipelineLine />

                <PipelineStep
                  icon={<BrainCircuit size={14} />}
                  title="LLM"
                  subtitle="Grounded generation"
                />

              </div>

            </div>


            {/* SUPPORTED CONTENT */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <div className="mb-3 flex items-center gap-2">

                <FileText
                  size={16}
                  className="text-indigo-600"
                />

                <h2 className="text-sm font-bold">
                  Supported Content
                </h2>

              </div>


              <div className="grid grid-cols-2 gap-2">

                <ContentType
                  icon={<FileText size={14} />}
                  label="PDF"
                />

                <ContentType
                  icon={<Presentation size={14} />}
                  label="PPT"
                />

                <ContentType
                  icon={<FileSpreadsheet size={14} />}
                  label="Excel"
                />

                <ContentType
                  icon={<Image size={14} />}
                  label="Images"
                />

                <ContentType
                  icon={<ScanText size={14} />}
                  label="OCR"
                />

                <ContentType
                  icon={<Table2 size={14} />}
                  label="Tables"
                />

              </div>

            </div>


            {/* CAPABILITIES */}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Capabilities
              </p>

              <div className="space-y-3">

                <CapabilityRow
                  label="Vector Retrieval"
                  active
                />

                <CapabilityRow
                  label="Multimodal Search"
                  active
                />

                <CapabilityRow
                  label="OCR Processing"
                  active
                />

                <CapabilityRow
                  label="Context Grounding"
                  active
                />

              </div>

            </div>

          </aside>

        </div>
      </main>
    </div>
  );
}


/* ================================================================
   COMPONENTS
================================================================ */


function PipelineStep({
  icon,
  title,
  subtitle,
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">

      <div className="rounded-lg bg-white p-1.5 text-indigo-600 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="truncate text-xs font-bold">
          {title}
        </p>

        <p className="truncate text-[10px] text-slate-400">
          {subtitle}
        </p>

      </div>

      <CheckCircle2
        size={14}
        className="ml-auto shrink-0 text-emerald-500"
      />

    </div>
  );
}


function PipelineLine() {
  return (
    <div className="ml-5 h-2 w-px bg-slate-200" />
  );
}


function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-xs font-bold text-slate-700">
        {value}
      </span>

    </div>
  );
}


function ContentType({
  icon,
  label,
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">

      <span className="text-indigo-500">
        {icon}
      </span>

      <span className="text-[10px] font-semibold text-slate-600">
        {label}
      </span>

    </div>
  );
}


function CapabilityRow({
  label,
  active = false,
}) {
  return (
    <div className="flex items-center justify-between">

      <span className="text-xs text-slate-500">
        {label}
      </span>

      {active && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

          ON

        </span>
      )}

    </div>
  );
}


function EmptyKnowledge() {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-5 text-center">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
        <Search size={22} />
      </div>

      <h3 className="mt-4 text-sm font-bold">
        No documents
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        Upload a document to build your knowledge base.
      </p>

    </div>
  );
}