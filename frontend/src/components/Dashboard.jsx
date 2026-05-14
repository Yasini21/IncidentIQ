import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import CreateIncident from "./CreateIncident";

const socket = io("http://localhost:5000");

function Dashboard() {
  const role = localStorage.getItem("role");

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState(null);

  const fetchIncidents = () => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:5000/api/incidents", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setIncidents(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchIncidents();

    const interval = setInterval(fetchIncidents, 3000);

    socket.on("newIncident", fetchIncidents);

    return () => {
      clearInterval(interval);
      socket.off("newIncident");
    };
  }, []);

  const updateStatus = async (id) => {
    setLoadingId(id);
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:5000/api/incidents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "RESOLVED" }),
    });

    setLoadingId(null);
    fetchIncidents();
  };

  const deleteIncident = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:5000/api/incidents/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchIncidents();
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch = inc.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "ALL" || inc.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl font-semibold">Incident Dashboard</h2>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Create Incident
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search incidents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full sm:w-80"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border p-2 rounded w-full sm:w-40"
        >
          <option value="ALL">All</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-hidden">

        {loading ? (
          <p className="p-6 text-gray-500">Loading...</p>
        ) : filteredIncidents.length === 0 ? (
          <p className="p-6 text-center text-gray-500">
            🚀 No incidents found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">

              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-center">Severity</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Analysis</th>

                  {/* ONLY engineer/admin */}
                  {(role === "admin" || role === "engineer") && (
                    <th className="p-3 text-center">Suggestion</th>
                  )}

                  {/* ONLY engineer/admin */}
                  {(role === "admin" || role === "engineer") && (
                    <th className="p-3 text-center">Action</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredIncidents.map((inc) => (
                  <tr key={inc._id} className="border-t hover:bg-gray-50">

                    <td className="p-3 font-medium">{inc.title}</td>

                    <td className="text-center">
                      <span className="bg-yellow-100 px-2 rounded text-xs">
                        {inc.severity}
                      </span>
                    </td>

                    <td className="text-center">
                      <span className={`px-2 text-xs rounded ${
                        inc.status === "OPEN"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"
                      }`}>
                        {inc.status}
                      </span>
                    </td>

                    {/* Analysis */}
                    <td className="text-center text-xs">
                      {inc.analysis ? (
                        <span className="text-green-600 font-medium">
                          {inc.analysis}
                        </span>
                      ) : (
                        <span className="text-yellow-600 animate-pulse">
                          ⏳ Processing...
                        </span>
                      )}
                    </td>

                    {/* Suggestion */}
                    {(role === "admin" || role === "engineer") && (
                      <td className="text-center text-xs text-blue-600">
                        {inc.suggestion || "-"}
                      </td>
                    )}

                    {/* Action */}
                    {(role === "admin" || role === "engineer") && (
                      <td className="text-center space-x-2">

                        {/* Resolve */}
                        {inc.status === "OPEN" && (
                          <button
                            onClick={() => updateStatus(inc._id)}
                            disabled={loadingId === inc._id}
                            className="bg-green-500 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
                          >
                            {loadingId === inc._id ? "..." : "Resolve"}
                          </button>
                        )}

                        {/* Delete ONLY admin */}
                        {role === "admin" && (
                          <button
                            onClick={() => deleteIncident(inc._id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        )}

                      </td>
                    )}

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white p-6 rounded w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <CreateIncident closeModal={() => setShowModal(false)} />
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;