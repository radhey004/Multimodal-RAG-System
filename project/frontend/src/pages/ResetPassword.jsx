import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";

import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword(
        params.get("token"),
        password,
        confirm
      );

      setMessage(
        "Password changed successfully. You can now login."
      );

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <KeyRound />
        </div>

        <h1 className="text-3xl font-bold">
          Create new password
        </h1>

        <p className="mt-2 text-slate-500">
          Your new password must be different from previous passwords.
        </p>

        {message && (
          <div className="mt-5 rounded-xl bg-slate-100 p-3 text-sm">
            {message}
          </div>
        )}

        <form
          onSubmit={submit}
          className="mt-7 space-y-4"
        >
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-semibold text-indigo-600"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}