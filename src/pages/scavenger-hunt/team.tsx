import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { useUser } from "@clerk/nextjs";
import { TeamSelector } from "@/components/TeamSelector";
import { TeamMembers } from "@/components/TeamMembers";
import { TaskList } from "@/components/TaskList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClerkUser, ScavengerTask, ScavengerTeam } from "@/types";
import { ScavengerFeed } from "@/components/ScavengerFeed";
import { TaskSubmissionForm } from "@/components/TaskSubmissionForm";

export default function TeamPage() {
  const { user } = useUser();
  const [teams, setTeams] = useState<ScavengerTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ScavengerTeam | null>(null);
  const [tasks, setTasks] = useState<ScavengerTask[]>([]);
  const [clerkUsers, setClerkUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [user, isAdmin]);

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

      {isAdmin && teams.length > 1 && (
        <TeamSelector teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
      )}

      <h2 className="mt-4 text-xl font-bold">Team: {selectedTeam.name}</h2>
      <TeamMembers members={selectedTeam.members} clerkUsers={clerkUsers} />

      {/* ✅ Tabs System */}
      <Tabs defaultValue="tasks" className="w-full mt-6">
        <TabsList className="flex justify-center items-center w-full bg-transparent p-2 rounded-lg mb-3">
          <div className="flex w-full max-w-md justify-center gap-2 flex-wrap">
            <TabsTrigger
              value="tasks"
              className="flex-1 text-center rounded-md px-3 py-2 text-sm md:text-md font-bold transition-all text-black
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
            >
              📜 Tasks
            </TabsTrigger>
            <TabsTrigger
              value="feed"
              className="flex-1 text-center rounded-md px-3 py-2 text-sm md:text-md font-bold transition-all text-black
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
            >
              📰 Feed
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="flex-1 text-center rounded-md px-3 py-2 text-sm md:text-md font-bold transition-all text-black
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
            >
              ℹ️ Information
            </TabsTrigger>
          </div>
        </TabsList>

        {/* 📜 Tasks Tab */}
        <TabsContent value="tasks">
          <TaskList tasks={tasks} teamId={selectedTeam.id} />
          <TaskSubmissionForm tasks={tasks} selectedTeam={selectedTeam} />
        </TabsContent>

        {/* 📰 Feed Tab */}
        <TabsContent value="feed">
          <ScavengerFeed />
        </TabsContent>

        {/* ℹ️ Information Tab */}
        <TabsContent value="info">
          <div className="p-4 bg-gray-100 rounded-md shadow">
            <h3 className="text-lg font-semibold">ℹ️ Team Information</h3>
            <p className="text-gray-700 mt-2">
              Welcome to the scavenger hunt! Here, you can see your tasks, check team progress, and stay updated.
            </p>
            <p className="text-gray-700 mt-2">
              🏆 Complete tasks to earn points. Judges will approve submissions before awarding points.
            </p>
            <p className="text-gray-700 mt-2">
              🎯 Make sure to upload valid photo/video evidence when completing tasks.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
