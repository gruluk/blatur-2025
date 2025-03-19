import { useState, useEffect } from "react";
import { supabase } from "../../supabase";

interface ScavengerTeam {
  id: string;
  name: string;
  members: string[]; // Array of Clerk user IDs
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export default function ScavengerTeams() {
  const [teams, setTeams] = useState<ScavengerTeam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newTeam, setNewTeam] = useState({ name: "" });
  const [editingTeam, setEditingTeam] = useState<ScavengerTeam | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  // ✅ Fetch Teams
  async function fetchTeams() {
    const { data } = await supabase.from("scavenger_teams").select("*");
    if (data) setTeams(data);
  }

  // ✅ Fetch Users from Clerk
  async function fetchUsers() {
    const res = await fetch("/api/users"); // Replace with actual API route to fetch Clerk users
    if (res.ok) {
      const userData = await res.json();
      setUsers(userData);
    }
  }

  // ✅ Create a New Team
  async function addTeam() {
    if (!newTeam.name) return alert("Team name cannot be empty!");
    const { data } = await supabase.from("scavenger_teams").insert([{ name: newTeam.name, members: [] }]).select("*");
    if (data) setTeams([...teams, data[0]]);
    setNewTeam({ name: "" });
  }

  // ✅ Update an Existing Team
  async function updateTeam() {
    if (!editingTeam) return;
    await supabase.from("scavenger_teams").update(editingTeam).eq("id", editingTeam.id);
    setTeams(teams.map((team) => (team.id === editingTeam.id ? editingTeam : team)));
    setEditingTeam(null);
  }

  // ✅ Delete a Team
  async function deleteTeam(id: string) {
    await supabase.from("scavenger_teams").delete().eq("id", id);
    setTeams(teams.filter((team) => team.id !== id));
  }

  // ✅ Add User to a Team (Updated)
  async function addUserToTeam() {
    if (!selectedTeam || !selectedUser) return alert("Select a team and a user.");

    const team = teams.find((t) => t.id === selectedTeam);
    if (!team) return;

    // ✅ Check if user is already in another team
    const isUserInTeam = teams.some((t) => t.members.includes(selectedUser));
    if (isUserInTeam) return alert("User is already in a team!");

    const updatedMembers = [...team.members, selectedUser];

    const { error } = await supabase
        .from("scavenger_teams")
        .update({ members: updatedMembers })
        .eq("id", team.id);

    if (error) {
        console.error("Error adding user:", error);
    } else {
        // ✅ Fetch updated teams to reflect changes
        await fetchTeams();
        setSelectedUser(null);
    }
  }

  // ✅ Remove User from a Team (Updated)
  async function removeUserFromTeam(teamId: string, userId: string) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const updatedMembers = team.members.filter((id) => id !== userId);

    const { error } = await supabase.from("scavenger_teams").update({ members: updatedMembers }).eq("id", team.id);

    if (error) {
        console.error("Error removing user:", error);
    } else {
        // ✅ Fetch updated teams to reflect changes
        await fetchTeams();
    }
  }

  return (
    <div className="p-4 mt-5 bg-gray-100 rounded-lg shadow-lg max-w-3xl mx-auto">
      {/* Header */}
      <h3 className="text-2xl font-bold text-gray-800 mb-4">👥 Team Management</h3>

      {/* ➕ Add/Edit Team */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          className="flex-1 border text-black border-gray-300 p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Team Name"
          value={editingTeam ? editingTeam.name : newTeam.name}
          onChange={(e) =>
            editingTeam ? setEditingTeam({ ...editingTeam, name: e.target.value }) : setNewTeam({ ...newTeam, name: e.target.value })
          }
        />
        <button
          className={`px-4 py-2 font-bold text-white rounded-md shadow-md transition ${
            editingTeam ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
          }`}
          onClick={editingTeam ? updateTeam : addTeam}
        >
          {editingTeam ? "✏️ Update" : "➕ Add"}
        </button>
      </div>

      {/* 🔥 Team List */}
      <ul className="mt-6 space-y-4">
        {teams.map((team) => (
          <li key={team.id} className="bg-white shadow-md rounded-lg border border-gray-300 p-4">
            {/* Team Name & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-lg font-semibold text-gray-800">{team.name}</h4>

              <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
                <button
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition shadow-md w-full sm:w-auto"
                  onClick={() => setEditingTeam(team)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition shadow-md w-full sm:w-auto"
                  onClick={() => deleteTeam(team.id)}
                >
                  ❌ Delete
                </button>
              </div>
            </div>

            {/* 📌 List of Team Members */}
            <ul className="mt-3 bg-gray-100 p-3 rounded-md">
              {team.members.length === 0 ? (
                <p className="text-gray-500 text-sm">No members yet</p>
              ) : (
                team.members.map((memberId) => {
                  const user = users.find((u) => u.id === memberId);
                  return (
                    <li key={memberId} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm mt-1">
                      <span className="text-gray-800">{user ? `${user.firstName} ${user.lastName}` : "Unknown User"}</span>
                      <button
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition shadow-sm text-xs sm:text-sm"
                        onClick={() => removeUserFromTeam(team.id, memberId)}
                      >
                        ❌ Remove
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </li>
        ))}
      </ul>

      {/* ➕ Add User to Team */}
      <h3 className="text-xl text-black font-semibold mt-6">➕ Add User to Team</h3>
      <div className="flex flex-col sm:flex-row gap-3 mt-3">
        <select
          className="flex-1 text-black border border-gray-300 p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedUser || ""}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select a User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>

        <select
          className="flex-1 text-black border border-gray-300 p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedTeam || ""}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">Select a Team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <button
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition shadow-md w-full sm:w-auto"
          onClick={addUserToTeam}
        >
          ➕ Add
        </button>
      </div>
    </div>
  );
}
