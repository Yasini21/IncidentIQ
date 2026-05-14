import { useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex justify-center px-4 py-10">
        <div
          className="
            bg-white
            w-full
            max-w-md
            p-8
            rounded-xl
            border border-gray-200
            shadow-md
          "
        >
          {/* TITLE */}
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
            Create an Account
          </h2>

          {/* SUBTEXT */}
          <p className="text-center text-sm text-gray-500 mb-8">
            Sign up to manage incidents efficiently
          </p>

          {/* FORM */}
          <form className="space-y-5">
            {/* NAME */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="
                  w-full
                  px-4 py-2
                  border border-gray-300
                  rounded-lg
                  focus:outline-none
                  focus:ring-2 focus:ring-blue-500
                "
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="
                  w-full
                  px-4 py-2
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
                placeholder="Minimum 6 characters"
                className="
                  w-full
                  px-4 py-2
                  border border-gray-300
                  rounded-lg
                  focus:outline-none
                  focus:ring-2 focus:ring-blue-500
                "
              />
            </div>

            {/* REGISTER BUTTON */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await API.post("/auth/register", {
                    name,
                    email,
                    password,
                  });
                  alert("Registration successful! Please login.");
                  navigate("/login");
                } catch (err) {
                  alert(err.response?.data?.msg || "Registration failed");
                }
              }}
              className="
                w-full
                bg-blue-600
                text-white
                py-2
                rounded-lg
                font-medium
                hover:bg-blue-700
                transition
              "
            >
              Register
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-sm mt-6 text-gray-500">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;