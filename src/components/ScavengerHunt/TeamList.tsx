import { useState, useEffect } from "react";
import { supabase } from "../../../supabase";

export default function TeamList({ teams, setTeams, selectedTeam, setSelectedTeam, users, tasks = [] }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [teamTasks, setTeamTasks] = useState([]); // 🔥 Store task completion status for selected team

  // 🔥 Fetch task completion status for the selected team
  useEffect(() => {
    if (!selectedTeam) return;

    async function fetchTeamTaskStatus() {
      if (!selectedTeam) return;

      const { data, error } = await supabase
        .from("scavenger_hunt_team_tasks")
        .select("task_id, completed, reviewed, approved") // ✅ Include approved
        .eq("team_id", selectedTeam.id);

      if (error) {
        console.error("❌ Error fetching team task status:", error);
        return;
      }

      setTeamTasks(data || []);
    }

    fetchTeamTaskStatus();
  }, [selectedTeam]);

  async function addUserToTeam() {
    if (!selectedTeam || !selectedUser) return alert("Select a team and a user!");

    if (selectedTeam.user_ids.includes(selectedUser)) {
      return alert("❌ User is already in this team!");
    }

    const updatedUserIds = [...selectedTeam.user_ids, selectedUser];

    const { data, error } = await supabase
      .from("teams")
      .update({ user_ids: updatedUserIds })
      .eq("id", selectedTeam.id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error adding user to team:", error);
      return;
    }

    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === selectedTeam.id ? { ...team, user_ids: data.user_ids } : team
      )
    );

    setSelectedTeam((prev) =>
      prev && prev.id === data.id ? { ...prev, user_ids: data.user_ids } : prev
    );

    console.log(`✅ Added user ${selectedUser} to team ${selectedTeam.name}`);
    setSelectedUser(null);
  }

  async function removeUserFromTeam(userId) {
    if (!selectedTeam) return;

    const updatedUserIds = selectedTeam.user_ids.filter((id) => id !== userId);

    const { data, error } = await supabase
      .from("teams")
      .update({ user_ids: updatedUserIds })
      .eq("id", selectedTeam.id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error removing user:", error);
      return;
    }

    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === selectedTeam.id ? { ...team, user_ids: data.user_ids } : team
      )
    );

    setSelectedTeam((prev) =>
      prev && prev.id === data.id ? { ...prev, user_ids: data.user_ids } : prev
    );

    console.log(`✅ Removed user ${userId} from team ${selectedTeam.name}`);
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h2 className="text-lg font-semibold">Teams</h2>
      {teams.length === 0 ? (
        <p className="text-gray-500">No teams created yet.</p>
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className={`w-full px-4 py-2 rounded-md border ${
                selectedTeam?.id === team.id ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}

      {/* 🔥 Show users and tasks when a team is selected */}
      {selectedTeam && (
        <div className="mt-4 p-4 border border-gray-300 rounded-lg">
          {/* Team Members */}
          <h3 className="text-md font-semibold">Team Members:</h3>
          {selectedTeam.user_ids.length === 0 ? (
            <p className="text-gray-500">No members in this team.</p>
          ) : (
            <ul className="space-y-2">
              {selectedTeam.user_ids.map((userId) => {
                const user = users[userId]; // 🔥 Get user from user object
                return (
                  <li
                    key={userId}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm flex justify-between items-center"
                  >
                    <span>{user ? `${user.firstName} ${user.lastName}` : "Unknown User"}</span>
                    <button
                      className="px-2 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      onClick={() => removeUserFromTeam(userId)}
                    >
                      ❌ Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* 🔥 Add User to Team */}
          <h3 className="text-md font-semibold mt-4">Add a User:</h3>
          <select
            value={selectedUser || ""}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Select a user --</option>
            {Object.keys(users).map((userId) => (
              <option key={userId} value={userId}>
                {users[userId].firstName} {users[userId].lastName}
              </option>
            ))}
          </select>

          <button
            onClick={addUserToTeam}
            className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add User
          </button>

          {/* 🔥 Show ALL Tasks (Same for Every Team) */}
          <h3 className="text-md font-semibold mt-6">Tasks:</h3>
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks created yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => {
                // 🔥 Find task status for selected team
                const taskStatus = teamTasks.find((t) => t.task_id === task.id);

                return (
                  <a href={`/events/scavenger-hunt/task/${task.id}`} key={task.id}>
                    <li
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
                    >
                      <span>{task.task}</span>
                      <span
                        className={`px-2 py-1 rounded-md text-white ${
                          taskStatus?.reviewed
                            ? taskStatus?.approved
                              ? "bg-green-600" // ✅ Done
                              : "bg-red-600" // 🚫 Rejected
                            : taskStatus?.completed
                            ? "bg-yellow-600" // ⏳ Pending Review
                            : "bg-gray-600" // ❌ Not Done
                        }`}
                      >
                        {taskStatus?.reviewed
                          ? taskStatus?.approved
                            ? "✅ Done"
                            : "🚫 Rejected"
                          : taskStatus?.completed
                          ? "⏳ Pending Review"
                          : "❌ Not Done"}
                      </span>
                    </li>
                  </a>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
