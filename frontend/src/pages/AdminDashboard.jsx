import { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Fetch incidents
  const fetchIncidents = async () => {
    const res = await fetch("http://localhost:5000/api/incidents", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

console.log("INCIDENTS API:", data); // 🔥 debug

setIncidents(Array.isArray(data) ? data : []);
setLoading(false);
  };

  // Fetch users
  const fetchUsers = async () => {
    const res = await fetch("http://localhost:5000/api/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

const data = await res.json();

console.log("USERS API:", data); 

setUsers(Array.isArray(data) ? data : []);  };

  useEffect(() => {
    fetchIncidents();
    fetchUsers();
  }, []);

  // Resolve Incident
  const resolveIncident = async (id) => {
    await fetch(`http://localhost:5000/api/incidents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "RESOLVED" }),
    });

    fetchIncidents();
  };

  // Delete Incident
  const deleteIncident = async (id) => {
    await fetch(`http://localhost:5000/api/incidents/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchIncidents();
  };

  // Change Severity
  const changeSeverity = async (id, severity) => {
    await fetch(`http://localhost:5000/api/incidents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ severity }),
    });

    fetchIncidents();
  };

  // Update User Role
  const updateRole = async (id, role) => {
    await fetch(`http://localhost:5000/api/users/${id}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    fetchUsers();
  };

  return (
  <div className="space-y-8">

    {/* INCIDENT SECTION */}
    <div className="bg-white rounded-xl shadow p-5">

      <h2 className="text-lg font-semibold mb-4">🛠️ Incident Management</h2>

      <div className="space-y-3">
        {incidents.map((inc) => (
          <div
            key={inc._id}
            className="flex justify-between items-center p-4 border rounded-lg hover:shadow transition"
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
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {inc.status}
                </span>

              </div>
            </div>

            {/* RIGHT */}
            <div className="flex gap-2">

              <button
                onClick={() => resolveIncident(inc._id)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Resolve
              </button>

              <button
                onClick={() => deleteIncident(inc._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>

            </div>

          </div>
        ))}
      </div>
    </div>

    {/* USER MANAGEMENT (UPDATED UI) */}
    <div className="bg-white rounded-xl shadow p-5">

      <h2 className="text-lg font-semibold mb-4">👥 User Management</h2>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user._id}
            className="flex justify-between items-center p-4 border rounded-lg hover:shadow transition"
          >

            {/* LEFT */}
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">

              {/* Role badge */}
              <span
                className={`px-2 py-1 text-xs rounded ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-600"
                    : user.role === "engineer"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {user.role}
              </span>

              {/* Dropdown */}
              <select
                value={user.role}
                onChange={(e) =>
                  updateRole(user._id, e.target.value)
                }
                className="border px-2 py-1 rounded text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="engineer">Engineer</option>
                <option value="admin">Admin</option>
              </select>

            </div>

          </div>
        ))}
      </div>

    </div>

  </div>
);
};

export default AdminDashboard;