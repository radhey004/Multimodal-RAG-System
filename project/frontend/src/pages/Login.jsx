import {
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  login
} from "../services/api";


export default function Login() {

  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function handleSubmit(event) {

    event.preventDefault();

    setError("");

    try {

      setLoading(true);

      const result =
        await login(
          email,
          password
        );

      localStorage.setItem(
        "token",
        result.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          result.user
        )
      );

      navigate(
        "/dashboard"
      );

    } catch (error) {

      setError(
        error.message
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-5">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm"
      >

        <h1 className="mb-2 text-3xl font-bold">
          Welcome back
        </h1>

        <p className="mb-8 text-gray-500">
          Login to your Multimodal RAG account.
        </p>


        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}


        <label className="mb-2 block text-sm font-medium">
          Email
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="mb-5 w-full rounded-lg border px-4 py-3"
        />


        <label className="mb-2 block text-sm font-medium">
          Password
        </label>

        <input
          type="password"
          required
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="mb-6 w-full rounded-lg border px-4 py-3"
        />


        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-3 text-white disabled:opacity-50"
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>


        <p className="mt-6 text-center text-sm text-gray-500">

          Don't have an account?{" "}

          <Link
            to="/register"
            className="font-medium text-black"
          >
            Register
          </Link>

        </p>

      </form>

    </div>
  );
}