import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { useUser } from "@clerk/nextjs";
import { TeamSelector } from "@/components/TeamSelector";
import { TeamMembers } from "@/components/TeamMembers";
import { TaskList } from "@/components/TaskList";
import { ClerkUser, ScavengerTask, ScavengerTeam } from "@/types";

export default function TeamPage() {
  const { user } = useUser();
  const [teams, setTeams] = useState<ScavengerTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ScavengerTeam | null>(null);
  const [tasks, setTasks] = useState<ScavengerTask[]>([]);
  const [clerkUsers, setClerkUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Define `isAdmin` at the top
  const isAdmin = (user?.publicMetadata as { isAdmin?: boolean })?.isAdmin === true;

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);

      const { data, error } = isAdmin
        ? await supabase.from("scavenger_teams").select("*")
        : await supabase.from("scavenger_teams").select("*").filter("members", "cs", JSON.stringify([user?.id]));

      if (error) console.error("Error fetching teams:", error);
      if (data?.length) {
        setTeams(data);
        setSelectedTeam(data[0]);
      } else {
        setSelectedTeam(null);
      }
      setLoading(false);
    }

    async function fetchUsers() {
      const res = await fetch("/api/users");
      if (res.ok) {
        const users = await res.json();
        setClerkUsers(users);
      }
    }

    if (user?.id) {
      fetchTeams();
      fetchUsers();
    }
  }, [user, isAdmin]); // ✅ Include `isAdmin` in dependency array

  useEffect(() => {
    if (!selectedTeam) return;
    async function fetchTasks() {
      const { data, error } = await supabase.from("scavenger_tasks").select("*");
      if (error) console.error("Error fetching tasks:", error);
      setTasks(data || []);
    }
    fetchTasks();
  }, [selectedTeam]);

  if (!user?.id) return <p>Loading user...</p>;
  if (loading) return <p>Loading team data...</p>;
  if (!selectedTeam) return <p>No team found. Ask a judge</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold">🏆 Scavenger Hunt - Team Page</h1>

      {/* ✅ Now `isAdmin` is available */}
      {isAdmin && teams.length > 1 && (
        <TeamSelector teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
      )}

      <h2 className="mt-4 text-xl font-bold">Team: {selectedTeam.name}</h2>

      {/* ✅ Show team members with names */}
      <TeamMembers members={selectedTeam.members} clerkUsers={clerkUsers} />

      {/* ✅ Show task list */}
      <TaskList tasks={tasks} />
    </div>
  );
}
