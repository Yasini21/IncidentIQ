import { useState } from "react";
import toast from "react-hot-toast";
import API from "../services/api";

function CreateIncident({ closeModal, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [service, setService] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await API.post("/incidents", {
        title,
        description,
        service,
      });

      toast.success("Incident created");
      setTitle("");
      setDescription("");
      setService("");

      if (onCreated) {
        onCreated(data);
      }
      if (closeModal) {
        closeModal();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.msg ||
          "Failed to create incident"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
          New report
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Report an incident
        </h2>
      </div>

      <input
        className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder="Title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <input
        className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder="Service (optional)"
        value={service}
        onChange={(event) => setService(event.target.value)}
      />

      <textarea
        className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        placeholder="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create"}
      </button>
    </form>
  );
}

export default CreateIncident;
