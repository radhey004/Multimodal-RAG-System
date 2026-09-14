import {
  useState
} from "react";

import {
  askQuestion
} from "../services/api";


export default function ChatBox() {

  const [query, setQuery] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [loading, setLoading] =
    useState(false);


  async function handleSubmit(event) {

    event.preventDefault();

    if (!query.trim() || loading) {
      return;
    }

    const question =
      query.trim();

    setQuery("");

    setMessages(
      previous => [
        ...previous,
        {
          role: "user",
          content: question
        }
      ]
    );

    try {

      setLoading(true);

      const result =
        await askQuestion(
          question
        );

      setMessages(
        previous => [
          ...previous,
          {
            role: "assistant",
            content:
              result.answer,
            sources:
              result.sources
          }
        ]
      );

    } catch (error) {

      setMessages(
        previous => [
          ...previous,
          {
            role: "assistant",
            content:
              `Error: ${error.message}`
          }
        ]
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <div className="flex h-[600px] flex-col rounded-2xl border bg-white shadow-sm">

      <div className="border-b p-5">

        <h2 className="font-semibold">
          Document Assistant
        </h2>

        <p className="text-sm text-gray-500">
          Ask questions about your uploaded documents.
        </p>

      </div>


      <div className="flex-1 space-y-4 overflow-y-auto p-5">

        {messages.length === 0 && (

          <div className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            Ask something like:
            <br />
            <br />
            "What is the definition of cloud computing?"
          </div>

        )}


        {messages.map(
          (message, index) => (

            <div
              key={index}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%] rounded-xl bg-black p-4 text-white"
                  : "max-w-[90%] rounded-xl bg-gray-100 p-4"
              }
            >

              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>


              {message.sources?.length > 0 && (

                <div className="mt-4 border-t pt-3">

                  <p className="mb-2 text-xs font-semibold">
                    Retrieved Sources
                  </p>

                  {message.sources.map(
                    source => (
                      <div
                        key={source.number}
                        className="text-xs text-gray-600"
                      >
                        {source.text}
                      </div>
                    )
                  )}

                </div>

              )}

            </div>

          )
        )}


        {loading && (

          <div className="rounded-xl bg-gray-100 p-4 text-sm text-gray-500">
            Searching documents and generating answer...
          </div>

        )}

      </div>


      <form
        onSubmit={handleSubmit}
        className="flex gap-3 border-t p-4"
      >

        <input
          value={query}
          onChange={(e) =>
            setQuery(
              e.target.value
            )
          }
          placeholder="Ask a question..."
          className="flex-1 rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          disabled={
            loading ||
            !query.trim()
          }
          className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          Ask
        </button>

      </form>

    </div>
  );
}