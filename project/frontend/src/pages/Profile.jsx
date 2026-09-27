import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import Navbar from "../components/Navbar";
import { updateProfile } from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const [form, setForm] = useState({
    full_name: user.name || "",
    email: user.email || "",
    current_password: "",
    new_password: ""
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const update = e =>
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  const submit = async e => {
    e.preventDefault();

    try {
      setLoading(true);

      const result = await updateProfile(form);

      localStorage.setItem(
        "user",
        JSON.stringify(result.user)
      );

      localStorage.setItem(
        "token",
        result.token
      );

      setForm({
        ...form,
        current_password: "",
        new_password: ""
      });

      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-3xl p-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500"
        >
          <ArrowLeft size={16} />
          Back to workspace
        </button>

        <div className="rounded-3xl border bg-white p-7 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-xl font-bold text-indigo-600">
              {form.full_name?.[0]?.toUpperCase() || "U"}
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Account settings
              </h1>
              <p className="text-sm text-slate-500">
                Manage your Multimodal RAG account.
              </p>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700">
              {message}
            </div>
          )}

          <form
            onSubmit={submit}
            className="mt-8 space-y-5"
          >
            <Field
              label="Full name"
              name="full_name"
              value={form.full_name}
              onChange={update}
            />

            <Field
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={update}
            />

            <div className="my-7 border-t" />

            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={18} />
              Security verification
            </div>

            <Field
              label="Current password"
              type="password"
              name="current_password"
              value={form.current_password}
              onChange={update}
            />

            <Field
              label="New password (optional)"
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={update}
              minLength={8}
            />

            <p className="text-xs text-slate-500">
              New passwords must contain letters and numbers
              and cannot be one of your previous passwords.
            </p>

            <button
              disabled={loading}
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : "Save changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      <input
        {...props}
        required={!props.name?.includes("new_password")}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  );
}