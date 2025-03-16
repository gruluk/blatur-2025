import { useState } from "react";

export default function TeamList({ teams, selectedTeam, setSelectedTeam }) {
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
    </div>
  );
}
