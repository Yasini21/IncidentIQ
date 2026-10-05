import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../services/api";
import TeamManagement from "../components/TeamManagement";
import { Badge, Button, Card } from "../components/ui";

const statusTone = (status) => (status === "OPEN" ? "red" : status === "RESOLVED" ? "green" : "blue");

const AdminDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [savingUser, setSavingUser] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [assigningTeamId, setAssigningTeamId] = useState(null);

  const loadIncidents = useCallback(async () => {
    const { data } = await API.get("/incidents");
    setIncidents(Array.isArray(data) ? data : []);
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersError("");
    try {
      const { data } = await API.get("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsersError(err.response?.data?.msg || "Unable to load users.");
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadIncidents(), loadUsers()]);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, [loadIncidents, loadUsers]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const openIncidentDetails = async (id) => {
    setSelectedIncident(null);
    setDetailsLoading(true);

    try {
      const { data } = await API.get(`/incidents/${id}`);
      setSelectedIncident(data);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to load incident details");
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateIncident = async (id, changes) => {
    try {
      const { data: updatedIncident } = await API.patch(`/incidents/${id}`, changes);
      setIncidents((current) =>
        current.map((incident) => (incident._id === id ? { ...incident, ...updatedIncident } : incident))
      );
      if (selectedIncident?._id === id) {
        setSelectedIncident((current) => (current ? { ...current, ...updatedIncident } : current));
      }
      toast.success("Incident updated");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to update incident");
    }
  };

  const assignIncidentTeam = async (id, teamId) => {
    if (!id) return;

    setAssigningTeamId(id);
    try {
      await API.patch(`/incidents/${id}/team`, { teamId: teamId || null });
      const selectedTeam = teamId ? teams.find((team) => team._id === teamId) : null;

      setIncidents((current) =>
        current.map((incident) =>
          incident._id === id
            ? {
                ...incident,
                assignedTeam: selectedTeam ? { _id: selectedTeam._id, name: selectedTeam.name } : null,
              }
            : incident
        )
      );

      if (selectedIncident?._id === id) {
        setSelectedIncident((current) =>
          current
            ? {
                ...current,
                assignedTeam: selectedTeam ? { _id: selectedTeam._id, name: selectedTeam.name } : null,
              }
            : current
        );
      }

      toast.success(teamId ? "Development team assigned" : "Team assignment cleared");
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.msg || "Unable to update incident team");
    } finally {
      setAssigningTeamId(null);
    }
  };

  const deleteIncident = async (id) => {
    try {
      await API.delete(`/incidents/${id}`);
      toast.success("Incident deleted");
      await loadIncidents();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to delete incident");
    }
  };

  const updateRole = async (id, role) => {
    setSavingUser(id);
    try {
      await API.patch(`/users/${id}/role`, { role });
      toast.success("Role updated");
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to update role");
    } finally {
      setSavingUser(null);
    }
  };

  const updateTeam = async (id, teamId) => {
    setSavingUser(id);
    try {
      await API.patch(`/users/${id}/team`, { teamId: teamId || null });
      toast.success(teamId ? "Developer assigned to team" : "Developer removed from team");
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to update team");
    } finally {
      setSavingUser(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Admin workspace</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Operations overview</h2>
          <p className="mt-1 text-sm text-slate-500">Triage incidents and organize the engineering function.</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Open incidents</p>
          <p className="text-2xl font-bold text-blue-950">{incidents.filter((incident) => incident.status !== "RESOLVED").length}</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h3 className="font-bold text-slate-900">Incident queue</h3>
            <p className="mt-1 text-sm text-slate-500">Review severity and current status.</p>
          </div>
          <Badge>{incidents.length} total</Badge>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading incidents...</p>
        ) : incidents.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No incidents found.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {incidents.map((incident) => (
              <div key={incident._id} className="flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{incident.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={incident.severity === "P1" ? "red" : incident.severity === "P2" ? "amber" : "slate"}>{incident.severity}</Badge>
                    <Badge tone={statusTone(incident.status)}>{incident.status}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={incident.severity || "P3"}
                    onChange={(event) => updateIncident(incident._id, { severity: event.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    aria-label={`Severity for ${incident.title}`}
                  >
                    <option value="P1">P1</option>
                    <option value="P2">P2</option>
                    <option value="P3">P3</option>
                    <option value="P4">P4</option>
                  </select>
                  <select
                    value={incident.assignedTeam?._id || ""}
                    onChange={(event) => assignIncidentTeam(incident._id, event.target.value)}
                    disabled={assigningTeamId === incident._id}
                    className="max-w-[180px] rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    aria-label={`Development team for ${incident.title}`}
                  >
                    <option value="">No team</option>
                    {teams.map((team) => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                  <Button variant="secondary" className="text-xs" onClick={() => openIncidentDetails(incident._id)}>
                    View details
                  </Button>
                  {incident.status !== "RESOLVED" && (
                    <Button className="text-xs" onClick={() => updateIncident(incident._id, { status: "RESOLVED" })}>Resolve</Button>
                  )}
                  <Button variant="danger" className="text-xs" onClick={() => deleteIncident(incident._id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <TeamManagement onTeamsChange={setTeams} />

      {detailsLoading || selectedIncident ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedIncident(null)}
        >
          <Card className="w-full max-w-2xl p-6" onClick={(event) => event.stopPropagation()}>
            {detailsLoading ? (
              <p className="text-sm text-slate-500">Loading incident details...</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Incident details</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{selectedIncident.title}</h3>
                  </div>
                  <Button variant="secondary" onClick={() => setSelectedIncident(null)}>Close</Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={selectedIncident.status === "RESOLVED" ? "green" : selectedIncident.status === "IN_PROGRESS" ? "blue" : "red"}>{selectedIncident.status}</Badge>
                  <Badge tone={selectedIncident.severity === "P1" ? "red" : selectedIncident.severity === "P2" ? "amber" : "slate"}>{selectedIncident.severity}</Badge>
                  {selectedIncident.service && <Badge>{selectedIncident.service}</Badge>}
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Description</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{selectedIncident.description || "No description provided."}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Current severity</p>
                      <select
                        value={selectedIncident.severity || "P3"}
                        onChange={(event) => updateIncident(selectedIncident._id, { severity: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                        <option value="P3">P3</option>
                        <option value="P4">P4</option>
                      </select>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700">Development team</p>
                      <select
                        value={selectedIncident.assignedTeam?._id || ""}
                        onChange={(event) => assignIncidentTeam(selectedIncident._id, event.target.value)}
                        disabled={assigningTeamId === selectedIncident._id}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">No team assigned</option>
                        {teams.map((team) => (
                          <option key={team._id} value={team._id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Reported by</p>
                      <p className="mt-1 text-sm text-slate-600">{selectedIncident.reportedBy?.name || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Assigned team</p>
                      <p className="mt-1 text-sm text-slate-600">{selectedIncident.assignedTeam?.name || "Not assigned"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">Resolution</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{selectedIncident.resolution || "Resolution pending"}</p>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      ) : null}

      <Card id="users" className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Access directory</p>
          <h3 className="mt-1 font-bold text-slate-900">User management</h3>
          <p className="mt-1 text-sm text-slate-500">Manage roles and place developers on a team.</p>
        </div>

        {usersError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-rose-600">{usersError}</p>
            <Button variant="secondary" className="mt-3" onClick={loadUsers}>Try again</Button>
          </div>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Team</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        disabled={savingUser === user._id}
                        onChange={(event) => updateRole(user._id, event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium capitalize text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="user">User</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "developer" ? (
                        <select
                          value={user.team?._id || ""}
                          disabled={savingUser === user._id}
                          onChange={(event) => updateTeam(user._id, event.target.value)}
                          className="max-w-[180px] rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">No team</option>
                          {teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {savingUser === user._id ? "Saving..." : user.team?.name || "No team"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
