import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import API from "../services/api";
import CreateIncident from "./CreateIncident";
import { Badge, Button, Card } from "./ui";

const socket = io("http://localhost:5000");

function formatDate(date) {
  return new Date(date).toLocaleString();
}

function getStatusTone(status) {
  if (status === "RESOLVED") {
    return "green";
  }
  if (status === "IN_PROGRESS") {
    return "blue";
  }
  return "red";
}

function Dashboard() {
  const role = localStorage.getItem("role");
  const isUser = role === "user";

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const { data } = await API.get("/incidents");
      setIncidents(Array.isArray(data) ? data : []);
      setLoadError("");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.msg ||
        "Unable to load incidents.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    socket.on("newIncident", fetchIncidents);

    return () => {
      socket.off("newIncident", fetchIncidents);
    };
  }, [fetchIncidents]);

  const updateStatus = async (id) => {
    setLoadingId(id);
    try {
      await API.patch(`/incidents/${id}`, { status: "RESOLVED" });
      await fetchIncidents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update incident.");
    } finally {
      setLoadingId(null);
    }
  };

  const deleteIncident = async (id) => {
    try {
      await API.delete(`/incidents/${id}`);
      await fetchIncidents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete incident.");
    }
  };

  const openIncidentDetails = async (id) => {
    setSelectedIncident(null);
    setDetailsLoading(true);

    try {
      const { data } = await API.get(`/incidents/${id}`);
      setSelectedIncident(data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load incident details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch = incident.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || incident.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            {isUser ? "Your workspace" : "Workspace"}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {isUser ? "My Incidents" : "Incident dashboard"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isUser
              ? "Track the incidents you have reported."
              : "Monitor activity and keep your team informed."}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          {isUser ? "+ Report Incident" : "+ Create Incident"}
        </Button>
      </div>

      {!isUser && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-80"
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-40"
          >
            <option value="ALL">All</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      )}

      {loading ? (
        <Card className="p-8 text-sm text-slate-500">
          Loading incidents...
        </Card>
      ) : loadError ? (
        <Card className="p-8 text-sm text-rose-600">{loadError}</Card>
      ) : incidents.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-semibold text-slate-800">
            {isUser
              ? "You have not reported any incidents yet."
              : "No incidents found."}
          </p>
          {isUser && (
            <p className="mt-2 text-sm text-slate-500">
              Report an incident to see its status and updates here.
            </p>
          )}
        </Card>
      ) : isUser ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {incidents.map((incident) => (
            <Card key={incident._id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  {incident.title}
                </h3>
                <Badge tone={getStatusTone(incident.status)}>
                  {incident.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="amber">{incident.severity}</Badge>
                {incident.service && <Badge>{incident.service}</Badge>}
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Reported {formatDate(incident.createdAt)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Assigned team: {incident.assignedTeam?.name || "Not assigned"}
              </p>
              <Button
                variant="secondary"
                className="mt-5"
                onClick={() => openIncidentDetails(incident._id)}
              >
                View details
              </Button>
            </Card>
          ))}
        </div>
      ) : filteredIncidents.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          No incidents match your search.
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-center">Severity</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Analysis</th>
                  {(role === "admin" || role === "developer") && (
                    <>
                      <th className="p-3 text-center">Suggestion</th>
                      <th className="p-3 text-center">Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident) => (
                  <tr
                    key={incident._id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-3 font-medium">{incident.title}</td>
                    <td className="text-center">
                      <Badge tone="amber">{incident.severity}</Badge>
                    </td>
                    <td className="text-center">
                      <Badge tone={getStatusTone(incident.status)}>
                        {incident.status}
                      </Badge>
                    </td>
                    <td className="text-center text-xs">
                      {incident.analysis || "Processing..."}
                    </td>
                    {(role === "admin" || role === "developer") && (
                      <>
                        <td className="text-center text-xs text-blue-600">
                          {incident.suggestion || "-"}
                        </td>
                        <td className="space-x-2 text-center">
                          {incident.status === "OPEN" && (
                            <Button
                              onClick={() => updateStatus(incident._id)}
                              disabled={loadingId === incident._id}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {loadingId === incident._id
                                ? "Updating..."
                                : "Resolve"}
                            </Button>
                          )}
                          {role === "admin" && (
                            <Button
                              variant="danger"
                              onClick={() => deleteIncident(incident._id)}
                            >
                              Delete
                            </Button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <CreateIncident
              closeModal={() => setShowModal(false)}
              onCreated={fetchIncidents}
            />
          </div>
        </div>
      )}

      {(detailsLoading || selectedIncident) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setSelectedIncident(null);
            setDetailsLoading(false);
          }}
        >
          <Card
            className="w-full max-w-2xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            {detailsLoading ? (
              <p className="text-sm text-slate-500">
                Loading incident details...
              </p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedIncident.title}
                  </h3>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedIncident(null)}
                  >
                    Close
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={getStatusTone(selectedIncident.status)}>
                    {selectedIncident.status.replace("_", " ")}
                  </Badge>
                  <Badge tone="amber">{selectedIncident.severity}</Badge>
                  {selectedIncident.service && (
                    <Badge>{selectedIncident.service}</Badge>
                  )}
                </div>
                <p className="mt-5 whitespace-pre-wrap text-sm text-slate-700">
                  {selectedIncident.description || "No description provided."}
                </p>
                <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Assigned team</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {selectedIncident.assignedTeam?.name || "Not assigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Created</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {formatDate(selectedIncident.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Last updated</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {formatDate(selectedIncident.updatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Resolution</dt>
                    <dd className="mt-1 font-medium text-slate-800">
                      {selectedIncident.resolution || "Resolution pending"}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
