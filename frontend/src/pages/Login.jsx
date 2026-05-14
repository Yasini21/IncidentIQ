import { useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      {/* LOGIN CARD */}
      <div
        className="
          bg-white
          w-full
          max-w-md
          p-10
          rounded-xl
          border border-gray-200
          shadow-md
        "
      >
        {/* TITLE */}
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-3">
          Welcome Back
        </h2>

        {/* SUBTEXT */}
        <p className="text-center text-sm text-gray-500 mb-10">
          Login to manage incidents
        </p>

        {/* FORM */}
        <form className="space-y-6">

          {/* EMAIL */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full
                px-4
                py-2.5
                border border-gray-300
                rounded-lg
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
              "
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full
                px-4
                py-2.5
                border border-gray-300
                rounded-lg
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
              "
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await API.post("/auth/login", {
                  email,
                  password,
                });

                // FIXED STRUCTURE
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("role", res.data.user.role);
                localStorage.setItem(
                  "userName",
                  res.data.user.name || email
                );

                const role = res.data.user.role.toLowerCase();

              if (role === "admin") {
             navigate("/admin");
             } else if (role === "engineer") {
              navigate("/engineer");
            } else {
           navigate("/");
            }


              } catch (err) {
                alert(err.response?.data?.msg || "Login failed");
              }
            }}
            className="
              w-full
              bg-blue-600
              text-white
              py-2.5
              rounded-lg
              font-medium
              hover:bg-blue-700
              transition
            "
          >
            Login
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-sm mt-8 text-gray-500">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;