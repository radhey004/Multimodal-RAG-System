import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

import { register } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = e =>
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  const strength = [
    form.password.length >= 8,
    /[A-Za-z]/.test(form.password),
    /\d/.test(form.password)
  ].filter(Boolean).length;

  const submit = async e => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (strength < 3) {
      setError(
        "Password must contain at least 8 characters, a letter and a number."
      );
      return;
    }

    try {
      setLoading(true);

      await register(
        form.full_name,
        form.email,
        form.password,
        form.confirm_password
      );

      // Required flow:
      // Register -> Login -> Dashboard
      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successfully. Please login."
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-indigo-700 to-violet-900 p-10 text-white lg:block">
          <UserPlus size={34} />

          <h1 className="mt-16 text-4xl font-bold leading-tight">
            Build your personal AI document workspace.
          </h1>

          <p className="mt-5 leading-7 text-indigo-100">
            Upload PDFs, presentations, spreadsheets and images.
            Then ask questions using multimodal retrieval.
          </p>

          <div className="mt-12 space-y-4">
            {[
              "Semantic document search",
              "Image and OCR understanding",
              "Table-aware retrieval",
              "Source-grounded AI answers"
            ].map(item => (
              <div
                key={item}
                className="rounded-xl bg-white/10 p-4"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-3xl font-bold text-slate-900">
            Create your account
          </h2>

          <p className="mt-2 text-slate-500">
            Start building your intelligent document library.
          </p>

          {error && (
            <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={submit}
            className="mt-7 space-y-4"
          >
            <Field
              label="Full name"
              name="full_name"
              value={form.full_name}
              onChange={update}
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={update}
            />

            <Field
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={update}
            />

            {form.password && (
              <div>
                <div className="mb-2 flex gap-1">
                  {[1, 2, 3].map(n => (
                    <div
                      key={n}
                      className={`h-1.5 flex-1 rounded-full ${
                        n <= strength
                          ? "bg-indigo-600"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-xs text-slate-500">
                  8+ characters · letters · numbers
                </p>
              </div>
            )}

            <Field
              label="Confirm password"
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={update}
            />

            <button
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
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
        required
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
    </label>
  );
}