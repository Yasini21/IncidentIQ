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

  const navigation = role === "admin"
    ? [
        { label: "Dashboard", path: "/", icon: "▦" },
        { label: "Incidents", path: "/admin", icon: "◈" },
        { label: "Teams", path: "/admin#teams", icon: "⌘" },
        { label: "Users", path: "/admin#users", icon: "◉" },
        { label: "Analytics", path: "/analytics", icon: "⌁" },
      ]
    : role === "developer"
      ? [
          { label: "Dashboard", path: "/", icon: "▦" },
          { label: "Team Incidents", path: "/developer", icon: "◈" },
        ]
      : [
          { label: "Dashboard", path: "/", icon: "▦" },
          { label: "Report Incident", path: "/create", icon: "+" },
          { label: "My Incidents", path: "/", icon: "◈" },
        ];

  useEffect(() => {
    socket.on("newIncident", () => {
      if (role === "user") {
        return;
      }

      const message = "A new incident was reported";
      setNotifications((previousNotifications) => [
        message,
        ...previousNotifications,
      ]);
      toast.success(message);
    });

    return () => socket.off("newIncident");
  }, [role]);

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 z-50 flex h-screen w-72 shrink-0 flex-col bg-[#0b1730] p-5 text-white shadow-xl transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-black text-lg shadow-lg shadow-blue-950/40">IQ</div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">IncidentIQ</h2>
            <p className="text-xs text-slate-400">Operations console</p>
          </div>
        </div>

        <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navigation.map((item) => {
            const active = item.path.includes("#")
              ? location.pathname === item.path.split("#")[0]
              : isActive(item.path);
            return (
              <Link key={item.label} to={item.path} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-blue-500 text-white shadow-lg shadow-blue-950/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-slate-400">Signed in as</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">{localStorage.getItem("userName") || "IncidentIQ user"}</p>
          <p className="mt-1 text-xs capitalize text-blue-300">{role || "user"} account</p>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-8">

          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-xl text-slate-600 hover:bg-slate-100 md:hidden"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">IncidentIQ</p>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                Incident management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative rounded-lg p-2 text-lg hover:bg-slate-100"
              >
                🔔

                {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-xs text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl">
                  <h4 className="mb-2 font-semibold">Notifications</h4>

                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((notification, index) => (
                      <div key={index} className="border-b border-slate-100 py-1 text-sm">
                        🚨 {notification}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ROLE */}
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600 sm:inline-flex">
              {role || "user"}
            </span>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 sm:text-sm"
            >
              Logout
            </button>

          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}

export default Layout;