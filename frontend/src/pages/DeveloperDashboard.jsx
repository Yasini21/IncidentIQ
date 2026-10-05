import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const DeveloperDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const token = localStorage.getItem("token");
  const socket = io("http://localhost:5000");

  // Fetch incidents
  const fetchIncidents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/incidents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchIncidents();

  socket.on("newIncident", () => {
    fetchIncidents(); // 🔥 auto refresh
  });

  return () => socket.off("newIncident");
}, []);

  // Update status (flexible)
  const updateStatus = async (id, status) => {
    setLoadingId(id);

    await fetch(`http://localhost:5000/api/incidents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    setLoadingId(null);
    fetchIncidents();
  };

  // Show only active incidents
  const activeIncidents = incidents.filter(
    (inc) => inc.status !== "RESOLVED"
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Developer workspace</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Team incidents</h2>
        <p className="mt-1 text-sm text-slate-500">Your team&apos;s active incident queue will appear here.</p>
      </div>

      {/* CONTENT */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

        {loading ? (
          <p className="text-gray-500">Loading incidents...</p>
        ) : activeIncidents.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
            No active incidents. All systems stable.
          </p>
        ) : (
          <div className="space-y-4">
            {activeIncidents.map((inc) => (
              <div
                key={inc._id}
                className="flex justify-between items-center border p-4 rounded-lg hover:shadow transition"
              >

                {/* LEFT */}
                <div>
                  <h3 className="font-medium">{inc.title}</h3>

                  <div className="flex gap-2 mt-1">

                    {/* Severity */}
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        inc.severity === "HIGH"
                          ? "bg-red-100 text-red-600"
                          : inc.severity === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {inc.severity}
                    </span>

                    {/* Status */}
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        inc.status === "OPEN"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {inc.status}
                    </span>

                  </div>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex gap-2">

                  {/* Move to IN_PROGRESS */}
                  {inc.status === "OPEN" && (
                    <button
                      onClick={() =>
                        updateStatus(inc._id, "IN_PROGRESS")
                      }
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Start
                    </button>
                  )}

                  {/* Resolve */}
                  {inc.status !== "RESOLVED" && (
                    <button
                      onClick={() =>
                        updateStatus(inc._id, "RESOLVED")
                      }
                      disabled={loadingId === inc._id}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      {loadingId === inc._id ? "..." : "Resolve"}
                    </button>
                  )}

                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default DeveloperDashboard;