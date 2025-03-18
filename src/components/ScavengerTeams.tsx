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
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">👥 Team Management</h3>

      {/* ➕ Add/Edit Team */}
      <div className="flex gap-2">
        <input
          type="text"
          className="border p-2 rounded w-full"
          placeholder="Team Name"
          value={editingTeam ? editingTeam.name : newTeam.name}
          onChange={(e) =>
            editingTeam ? setEditingTeam({ ...editingTeam, name: e.target.value }) : setNewTeam({ ...newTeam, name: e.target.value })
          }
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={editingTeam ? updateTeam : addTeam}>
          {editingTeam ? "✏️ Update" : "➕ Add"}
        </button>
      </div>

      {/* 🔥 Team List */}
      <ul className="mt-4">
        {teams.map((team) => (
          <li key={team.id} className="p-2 bg-gray-800 text-white rounded">
            <div className="flex justify-between">
              <span>{team.name}</span>
              <div>
                <button className="bg-blue-500 px-3 py-1 rounded mr-2" onClick={() => setEditingTeam(team)}>✏️</button>
                <button className="bg-red-500 px-3 py-1 rounded" onClick={() => deleteTeam(team.id)}>❌</button>
              </div>
            </div>

            {/* 📌 List of Team Members */}
            <ul className="mt-2 bg-gray-700 p-2 rounded">
              {team.members.length === 0 ? (
                <p className="text-gray-400">No members yet</p>
              ) : (
                team.members.map((memberId) => {
                  const user = users.find((u) => u.id === memberId);
                  return (
                    <li key={memberId} className="flex justify-between p-1">
                      <span>{user ? `${user.firstName} ${user.lastName}` : "Unknown User"}</span>
                      <button className="bg-red-500 px-2 py-1 rounded" onClick={() => removeUserFromTeam(team.id, memberId)}>
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
      <h3 className="text-lg font-semibold mt-4">➕ Add User to Team</h3>
      <div className="flex gap-2">
        <select
          className="border p-2 rounded w-full"
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
          className="border p-2 rounded w-full"
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

        <button className="bg-green-500 px-4 py-2 text-white rounded" onClick={addUserToTeam}>
          ➕ Add
        </button>
      </div>
    </div>
  );
}
