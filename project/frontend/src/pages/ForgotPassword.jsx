import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();

    try {
      setLoading(true);
      const result = await forgotPassword(email);
      setMessage(result.message);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
        <Mail />
      </div>

      <h1 className="text-3xl font-bold">
        Forgot password?
      </h1>

      <p className="mt-2 text-slate-500">
        Enter your email and we'll send you a secure reset link.
      </p>

      {message && (
        <div className="mt-5 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700">
          {message}
        </div>
      )}

      <form onSubmit={submit} className="mt-7 space-y-5">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-100"
        />

        <button
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <Link
        to="/login"
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>
    </AuthCard>
  );
}

function AuthCard({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}