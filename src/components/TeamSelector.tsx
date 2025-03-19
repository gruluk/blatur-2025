import { ScavengerTeam } from "@/types"; // ✅ Import the type

interface TeamSelectorProps {
  teams: ScavengerTeam[];
  selectedTeam: ScavengerTeam | null;
  setSelectedTeam: (team: ScavengerTeam | null) => void;
}

export function TeamSelector({ teams, selectedTeam, setSelectedTeam }: TeamSelectorProps) {
  return (
    <div className="mt-4 p-2 rounded-lg bg-onlineOrange text-black">
      <label className="text-lg font-semibold">Only available for judges</label>
      <select
        className="border p-2 rounded w-full mt-2"
        value={selectedTeam?.id || ""}
        onChange={(e) => {
          const newTeam = teams.find((team) => team.id === e.target.value) || null;
          setSelectedTeam(newTeam);
        }}
      >
        <option value="" disabled>
          Select a team
        </option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}
