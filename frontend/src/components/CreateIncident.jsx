import { useState } from "react";
import toast from "react-hot-toast";

function CreateIncident({ closeModal }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("P3");

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/incidents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // 🔥 FIXED
      },
      body: JSON.stringify({
        title,
        description,
        severity,
      }),
    });

    const data = await res.json();
    console.log("CREATE RESPONSE:", data);

    toast.success("Incident Created 🚀");
    closeModal();

  } catch (err) {
    console.error(err);
    toast.error("Failed to create incident");
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      <h2 className="text-lg font-semibold">Create Incident</h2>

      <input
        className="w-full border p-2 rounded"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full border p-2 rounded"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <select
        className="w-full border p-2 rounded"
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
      >
        <option>P1</option>
        <option>P2</option>
        <option>P3</option>
      </select>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Create
      </button>

    </form>
  );
}

export default CreateIncident;