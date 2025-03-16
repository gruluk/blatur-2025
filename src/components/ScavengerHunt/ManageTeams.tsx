import { useState } from "react";
import { supabase } from "../../../supabase";

export default function ManageTeams({ teams, setTeams, users = [], eventId }) {
  const [newTeamName, setNewTeamName] = useState("");

  async function createTeam() {
    if (!newTeamName.trim()) return alert("Team name cannot be empty!");

    const { data, error } = await supabase
      .from("teams")
      .insert([{ name: newTeamName, user_ids: [], event_id: eventId }])
      .select()
      .single();

    if (error) {
      console.error("Error creating team:", error);
      return;
    }

    setTeams([...teams, data]);
    setNewTeamName("");
  }

  return (
    <div className="p-4 rounded-lg border border-gray-300">
      <h2 className="text-lg font-semibold">Manage Teams</h2>

      <div className="flex space-x-2 mt-2">
        <input
          type="text"
          placeholder="Enter team name..."
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-md"
        />
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          onClick={createTeam}
        >
          Create
        </button>
      </div>

      <h3 className="text-md font-semibold mt-4">Add Users</h3>
      <select className="w-full p-2 border border-gray-300 rounded-md">
        <option value="">-- Select a user --</option>
        {Array.isArray(users) && users.length > 0 ? (
          users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))
        ) : (
          <option disabled>No users available</option>
        )}
      </select>
    </div>
  );
}
