import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import API from "../services/api";
import { Badge, Button, Card } from "../components/ui";

const socket = io("http://localhost:5000");
const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];

const statusTone = {
  OPEN: "red",
  IN_PROGRESS: "blue",
  RESOLVED: "green",
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not available";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ||
  error.response?.data?.msg ||
  fallback;

const DeveloperDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [status, setStatus] = useState("OPEN");
  const [resolution, setResolution] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setListError("");
      const { data } = await API.get("/incidents");
      setIncidents(Array.isArray(data) ? data : []);
    } catch (error) {
      setListError(getErrorMessage(error, "Unable to load team incidents."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();

    const handleNewIncident = () => fetchIncidents();
    socket.on("newIncident", handleNewIncident);

    return () => socket.off("newIncident", handleNewIncident);
  }, [fetchIncidents]);

  const openIncident = async (incident) => {
    setSelectedIncident(incident);
    setDetailLoading(true);
    setDetailError("");
    setDetailUnavailable(false);

    try {
      const { data } = await API.get(`/incidents/${incident._id}`);
      setSelectedIncident(data);
      setStatus(data.status);
      setResolution(data.resolution || "");
    } catch (error) {
      const forbidden = error.response?.status === 403;
      setDetailUnavailable(forbidden);
      setDetailError(getErrorMessage(
        error,
        forbidden
          ? "You no longer have access to this incident because it is not assigned to your team."
          : "Unable to load incident details."
      ));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeIncident = () => {
    setSelectedIncident(null);
    setDetailError("");
    setDetailUnavailable(false);
  };

  const saveIncident = async (event) => {
    event.preventDefault();
    const trimmedResolution = resolution.trim();
    if (status === "RESOLVED" && !trimmedResolution) {
      setDetailError("Add a resolution before marking this incident resolved.");
      return;
    }

    setSaving(true);
    setDetailError("");
    try {
      const { data } = await API.patch(
        `/incidents/${selectedIncident._id}`,
        { status, resolution: trimmedResolution || null }
      );
      setSelectedIncident(data);
      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident._id === data._id ? data : incident
        )
      );
      setStatus(data.status);
      setResolution(data.resolution || "");
      toast.success("Incident updated successfully.");
    } catch (error) {
      const message = getErrorMessage(
        error,
        error.response?.status === 403
          ? "You are not authorized to update this incident."
          : "Unable to update the incident."
      );
      setDetailError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
          Developer workspace
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Team incidents
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Review and update incidents assigned to your team.
        </p>
      </header>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading team incidents...</p>
        ) : listError ? (
          <div className="space-y-4 p-6">
            <p className="text-sm text-rose-700" role="alert">{listError}</p>
            <Button variant="secondary" onClick={fetchIncidents}>
              Try again
            </Button>
          </div>
        ) : incidents.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No incidents are currently assigned to your team.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {incidents.map((incident) => (
              <li key={incident._id}>
                <button
                  type="button"
                  onClick={() => openIncident(incident)}
                  className="grid w-full gap-3 p-5 text-left transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">
                      {incident.title}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {incident.service || "Service not specified"}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone[incident.status]}>
                        {incident.status}
                      </Badge>
                      <Badge tone={incident.severity === "P1" ? "red" : "amber"}>
                        {incident.severity}
                      </Badge>
                    </span>
                  </span>
                  <span className="text-sm text-slate-500 sm:text-right">
                    <span className="block font-medium text-slate-700">
                      {incident.assignedTeam?.name || "Unassigned"}
                    </span>
                    <span className="mt-1 block">{formatDate(incident.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selectedIncident && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeIncident();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-detail-title"
            className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                  Incident details
                </p>
                <h3
                  id="incident-detail-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {selectedIncident.title}
                </h3>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={closeIncident}
                aria-label="Close incident details"
              >
                Close
              </Button>
            </div>

            {detailLoading ? (
              <p className="py-8 text-sm text-slate-500">
                Loading incident details...
              </p>
            ) : (
              <>
                {detailError && (
                  <p className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">
                    {detailError}
                  </p>
                )}

                <dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Service</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedIncident.service || "Not specified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Status</dt>
                    <dd className="mt-1">
                      <Badge tone={statusTone[selectedIncident.status]}>
                        {selectedIncident.status}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Severity</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedIncident.severity}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Reported by</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedIncident.reportedBy?.name || "Unknown"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Assigned team</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedIncident.assignedTeam?.name || "Unassigned"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Created</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {formatDate(selectedIncident.createdAt)}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Description</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-slate-900">
                      {selectedIncident.description || "No description provided."}
                    </dd>
                  </div>
                  {selectedIncident.resolution && (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Current resolution</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-slate-900">
                        {selectedIncident.resolution}
                      </dd>
                    </div>
                  )}
                </dl>

                {!detailUnavailable && (
                  <form className="mt-6 space-y-4" onSubmit={saveIncident}>
                  <div>
                    <label
                      htmlFor="incident-status"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Status
                    </label>
                    <select
                      id="incident-status"
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {statuses.map((option) => (
                        <option key={option} value={option}>
                          {option.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="incident-resolution"
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                    >
                      Resolution
                    </label>
                    <textarea
                      id="incident-resolution"
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      rows={4}
                      placeholder="Describe the resolution or investigation outcome"
                      className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {status === "RESOLVED" && (
                      <p className="mt-1 text-xs text-slate-500">
                        A resolution is required to resolve this incident.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save update"}
                    </Button>
                  </div>
                  </form>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default DeveloperDashboard;
