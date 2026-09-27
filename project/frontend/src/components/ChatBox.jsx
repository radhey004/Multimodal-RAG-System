import { useState } from "react";
import { Bot, Send, User } from "lucide-react";

import { askQuestion } from "../services/api";

export default function ChatBox() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    const question = query.trim();

    if (!question || loading) return;

    setQuery("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: question,
      },
    ]);

    try {
      setLoading(true);

      const result = await askQuestion(question);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">

      {/* =====================================================
          CHAT HEADER
      ===================================================== */}

      <header className="shrink-0 border-b bg-slate-950 px-5 py-4 text-white">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-indigo-600 p-2">
            <Bot size={20} />
          </div>

          <div className="min-w-0">

            <h2 className="font-bold">
              Document Intelligence
            </h2>

            <p className="text-xs text-slate-400">
              Ask questions about your uploaded knowledge base
            </p>

          </div>

        </div>

      </header>


      {/* =====================================================
          CHAT MESSAGES
      ===================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5">

        {/* EMPTY STATE */}

        {!messages.length && (

          <div className="flex h-full min-h-[180px] items-center justify-center">

            <div className="w-full max-w-xl rounded-2xl border bg-white p-6 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">

                <Bot size={24} />

              </div>

              <p className="mt-4 font-semibold text-slate-800">
                Ask your documents anything
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Ask questions about definitions, tables, numbers,
                diagrams or information inside your uploaded files.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">

                <Suggestion
                  text="Summarize this document"
                  onClick={() =>
                    setQuery("Summarize this document")
                  }
                />

                <Suggestion
                  text="Explain the main concepts"
                  onClick={() =>
                    setQuery("Explain the main concepts")
                  }
                />

                <Suggestion
                  text="Find important numbers"
                  onClick={() =>
                    setQuery("Find the important numbers")
                  }
                />

              </div>

            </div>

          </div>
        )}


        {/* MESSAGES */}

        <div className="space-y-4">

          {messages.map((message, index) => (

            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              {/* ASSISTANT ICON */}

              {message.role === "assistant" && (

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">

                  <Bot size={18} />

                </div>

              )}


              {/* MESSAGE */}

              <div
                className={`max-w-[82%] rounded-2xl p-4 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "border bg-white text-slate-700 shadow-sm"
                }`}
              >

                <div className="whitespace-pre-wrap">
                  {message.content}
                </div>


                {/* SOURCES */}

                {message.sources?.length > 0 && (

                  <div className="mt-4 border-t pt-3">

                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Sources
                    </p>

                    <div className="space-y-1">

                      {message.sources.map((source) => (

                        <p
                          key={source.number}
                          className="text-xs text-slate-500"
                        >
                          {source.text}
                        </p>

                      ))}

                    </div>

                  </div>

                )}

              </div>


              {/* USER ICON */}

              {message.role === "user" && (

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">

                  <User size={18} />

                </div>

              )}

            </div>

          ))}


          {/* LOADING */}

          {loading && (

            <div className="flex items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">

                <Bot size={18} />

              </div>

              <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />

                  <span>
                    Searching multimodal context...
                  </span>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* =====================================================
          QUESTION INPUT — ALWAYS AT BOTTOM
      ===================================================== */}

      <form
        onSubmit={submit}
        className="shrink-0 border-t bg-white p-3 sm:p-4"
      >

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your documents..."
            disabled={loading}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={17} />
          </button>

        </div>

        <p className="mt-1.5 px-2 text-[9px] text-slate-400">
          Answers are generated using retrieved context from your documents.
        </p>

      </form>

    </section>
  );
}


/* ================================================================
   SUGGESTION BUTTON
================================================================ */

function Suggestion({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
    >
      {text}
    </button>
  );
}