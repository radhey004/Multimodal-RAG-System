import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit, FileSearch, LockKeyhole } from "lucide-react";

import { login, googleLogin } from "../services/api";
import { googleSignIn } from "../services/firebase";

const saveSession = result => {
  localStorage.setItem("token", result.token);
  localStorage.setItem("user", JSON.stringify(result.user));
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      saveSession(await login(form.email, form.password));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      setError("");
      setLoading(true);
      saveSession(await googleLogin(await googleSignIn()));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
          <BrainCircuit size={28} />
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back
        </h1>

        <p className="mt-2 text-slate-500">
          Sign in to your intelligent document workspace.
        </p>
      </div>

      {error && <Alert text={error} />}

      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={e =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={e =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-indigo-600"
          >
            Forgot password?
          </Link>
        </div>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white shadow-lg transition hover:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <Divider />

      <button
        onClick={google}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 font-semibold text-slate-700 hover:bg-slate-50"
      >
        <span className="text-lg font-bold">G</span>
        Continue with Google
      </button>

      <p className="mt-8 text-center text-sm text-slate-500">
        New to Multimodal RAG?{" "}
        <Link
          to="/register"
          className="font-semibold text-indigo-600"
        >
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}


function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3 text-xl font-bold">
            <BrainCircuit />
            Multimodal RAG
          </div>

          <div className="mt-28 max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
              AI Document Intelligence
            </p>

            <h2 className="text-5xl font-bold leading-tight">
              Search, understand and chat with your documents.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-400">
              Combine text, tables, images and OCR with semantic
              retrieval and AI-powered answers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["Text", "Semantic search"],
            ["Images", "CLIP retrieval"],
            ["Tables", "Context aware"]
          ].map(([a, b]) => (
            <div
              key={a}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="font-semibold">{a}</p>
              <p className="mt-1 text-xs text-slate-400">{b}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        {...props}
        required
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  );
}

function Alert({ text }) {
  return (
    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
      {text}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs text-slate-400">OR</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}