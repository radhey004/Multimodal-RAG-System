import { useNavigate } from "react-router-dom";


export default function Navbar() {

  const navigate =
    useNavigate();


  function logout() {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  }


  return (
    <nav className="border-b bg-white px-6 py-4">

      <div className="mx-auto flex max-w-7xl items-center justify-between">

        <button
          onClick={() =>
            navigate("/dashboard")
          }
          className="text-xl font-bold"
        >
          Multimodal RAG
        </button>


        <div className="flex items-center gap-4">

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="text-gray-600 hover:text-black"
          >
            Dashboard
          </button>


          <button
            onClick={logout}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Logout
          </button>

        </div>

      </div>

    </nav>
  );
}
