import { useState } from "react";
import { supabase } from "../../../supabase";

export default function EventSettings({ event, setEvent }) {
  const [saving, setSaving] = useState(false);

  async function updateEvent() {
    if (!event) return;

    setSaving(true);
    const { error } = await supabase
      .from("events")
      .update({
        start_date: event.start_date,
        end_date: event.end_date,
        status: event.status,
      })
      .eq("id", event.id);

    setSaving(false);
    if (error) return alert("❌ Failed to update event!");
    alert("✅ Event updated successfully!");
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h2 className="text-lg font-semibold text-center">Edit Event</h2>

      <label className="block text-sm font-medium mt-2">Start Date:</label>
      <input
        type="datetime-local"
        value={event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : ""}
        onChange={(e) => setEvent({ ...event, start_date: new Date(e.target.value).toISOString() })}
        className="w-full p-2 border border-gray-300 rounded-md"
      />

      <label className="block text-sm font-medium mt-2">End Date:</label>
      <input
        type="datetime-local"
        value={event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : ""}
        onChange={(e) => setEvent({ ...event, end_date: new Date(e.target.value).toISOString() })}
        className="w-full p-2 border border-gray-300 rounded-md"
      />

      <label className="block text-sm font-medium mt-2">Status:</label>
      <select
        value={event.status}
        onChange={(e) => setEvent({ ...event, status: e.target.value })}
        className="w-full p-2 border border-gray-300 rounded-md"
      >
        <option value="hidden">🔒 Hidden</option>
        <option value="waiting">⏳ Waiting</option>
        <option value="ongoing">🚀 Ongoing</option>
        <option value="done">✅ Completed</option>
      </select>

      <button
        onClick={updateEvent}
        disabled={saving}
        className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
