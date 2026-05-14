import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  const location = useLocation();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    window.location.href = "/login";
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    socket.on("newIncident", (data) => {
      setNotifications((prev) => [data, ...prev]);
      toast.success(`New Incident: ${data.title}`);
    });

    return () => socket.off("newIncident");
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed md:static z-50 w-64 bg-white border-r border-gray-200 h-full p-5 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <h2 className="text-2xl font-bold mb-8 text-blue-600">
          🚀 IncidentAI
        </h2>

        <ul className="space-y-2">

          <Link to="/">
            <li className={`p-2 rounded-md ${
              isActive("/")
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}>
              📊 Dashboard
            </li>
          </Link>

          {role === "admin" && (
            <Link to="/analytics">
              <li className={`p-2 rounded-md ${
                isActive("/analytics")
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}>
                📈 Analytics
              </li>
            </Link>
          )}

          {(role === "engineer" || role === "admin") && (
            <>
              <li className="text-xs text-gray-400 mt-4 uppercase">
                Engineer Tools
              </li>
              <li className="text-gray-500 text-sm">
                ✔ Resolve Incidents
              </li>
            </>
          )}

          {role === "viewer" && (
            <>
              <li className="text-xs text-gray-400 mt-4 uppercase">
                Your Activity
              </li>
              <li className="text-gray-500 text-sm">
                ✔ Track Requests
              </li>
            </>
          )}

        </ul>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-xl"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>

            <h1 className="font-semibold text-gray-800">
              Incident Management
            </h1>
          </div>

          <div className="flex items-center gap-4">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="text-xl relative"
              >
                🔔

                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg rounded-md p-3 z-50">
                  <h4 className="font-semibold mb-2">Notifications</h4>

                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="text-sm border-b py-1">
                        🚨 {n.title}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ROLE */}
            <span className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-700">
              👤 {role?.toUpperCase()}
            </span>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>

          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

      </div>
    </div>
  );
}

export default Layout;