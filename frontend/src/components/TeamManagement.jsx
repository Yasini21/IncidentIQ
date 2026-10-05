import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../services/api";
import { Badge, Button, Card } from "./ui";

function TeamManagement({ onTeamsChange }) {
  const [teams, setTeams] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/teams");
      setTeams(data);
      onTeamsChange?.(data);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to load teams.");
    } finally {
      setLoading(false);
    }
  }, [onTeamsChange]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const createTeam = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await API.post("/teams", { name });
      setName("");
      toast.success("Team created");
      await loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to create team");
    } finally {
      setSaving(false);
    }
  };

  const saveTeam = async (id) => {
    if (!editingName.trim()) return;

    try {
      await API.patch(`/teams/${id}`, { name: editingName });
      setEditingId(null);
      toast.success("Team updated");
      await loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to update team");
    }
  };

  const deleteTeam = async (id) => {
    try {
      await API.delete(`/teams/${id}`);
      toast.success("Team deleted");
      await loadTeams();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Unable to delete team");
    }
  };

  return (
    <Card id="teams" className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Organization</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Development teams</h2>
          <p className="mt-1 text-sm text-slate-500">Route developers into focused technical groups.</p>
        </div>
        <form onSubmit={createTeam} className="flex w-full gap-2 sm:max-w-sm">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New team name"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? "Adding..." : "Add team"}
          </Button>
        </form>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading teams...</p>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-rose-600">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={loadTeams}>Try again</Button>
        </div>
      ) : teams.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No development teams created yet.</p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {teams.map((team) => (
            <div key={team._id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {editingId === team._id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && saveTeam(team._id)}
                      className="w-full rounded-md border border-blue-300 bg-white px-2 py-1 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  ) : (
                    <h3 className="truncate font-semibold text-slate-900">{team.name}</h3>
                  )}
                  <Badge tone="blue">{team.developerCount} {team.developerCount === 1 ? "developer" : "developers"}</Badge>
                </div>
                <div className="flex shrink-0 gap-2">
                  {editingId === team._id ? (
                    <Button className="px-2.5 py-1.5 text-xs" onClick={() => saveTeam(team._id)}>Save</Button>
                  ) : (
                    <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => { setEditingId(team._id); setEditingName(team.name); }}>Edit</Button>
                  )}
                  <Button variant="danger" className="px-2.5 py-1.5 text-xs" onClick={() => deleteTeam(team._id)} disabled={team.developerCount > 0}>Delete</Button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {team.members.length === 0 ? (
                  <p className="text-sm text-slate-400">No developers assigned.</p>
                ) : team.members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">{member.name}</span>
                    <span className="truncate pl-3 text-xs text-slate-400">{member.email}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default TeamManagement;
