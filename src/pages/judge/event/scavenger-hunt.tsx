import { useState, useEffect } from "react";
import { supabase } from "../../../../supabase";
import Header from "@/components/Header";
import EventSettings from "@/components/ScavengerHunt/EventSettings";
import ManageTeams from "@/components/ScavengerHunt/ManageTeams";
import ManageTasks from "@/components/ScavengerHunt/ManageTasks";
import TeamList from "@/components/ScavengerHunt/TeamList";
import TaskList from "@/components/ScavengerHunt/TaskList";

export default function JudgeScavengerHuntPage() {
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [users, setUsers] = useState([]); // ✅ Added state for users
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventData() {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("type", "scavenger-hunt")
        .single();

      if (!eventData) return setLoading(false);
      setEvent(eventData);

      const { data: teamData } = await supabase
        .from("teams")
        .select("*")
        .eq("event_id", eventData.id);
      setTeams(teamData || []);

      const { data: taskData } = await supabase
        .from("scavenger_hunt_tasks")
        .select("*")
        .eq("event_id", eventData.id);
      setTasks(taskData || []);

      const { data: teamTaskData } = await supabase.from("scavenger_hunt_team_tasks").select("*");
      setTeamTasks(teamTaskData || []);

      setLoading(false);
    }

    async function fetchUsers() {
      const { data: usersData, error } = await fetch("/api/users").then((res) => res.json());
      if (error) {
        console.error("❌ Error fetching users:", error);
        return;
      }
      setUsers(usersData);
    }

    fetchEventData();
    fetchUsers();
  }, []);

  async function markTaskCompleted(teamId, taskId) {
    const { error } = await supabase
      .from("scavenger_hunt_team_tasks")
      .update({ completed: true })
      .eq("task_id", taskId)
      .eq("team_id", teamId);

    if (!error) {
      setTeamTasks((prev) =>
        prev.map((t) => (t.task_id === taskId && t.team_id === teamId ? { ...t, completed: true } : t))
      );
    }
  }

  async function reviewTask(teamId, taskId) {
    const { error } = await supabase
      .from("scavenger_hunt_team_tasks")
      .update({ reviewed: true, reviewed_at: new Date() })
      .eq("task_id", taskId)
      .eq("team_id", teamId);

    if (!error) {
      setTeamTasks((prev) =>
        prev.map((t) =>
          t.task_id === taskId && t.team_id === teamId
            ? { ...t, reviewed: true, reviewed_at: new Date().toISOString() }
            : t
        )
      );
    }
  }

  return (
    <div className="w-full max-w-lg space-y-6 mx-auto mt-20 mb-15 bg-white p-5 rounded-lg shadow-md">
      <Header />
      {loading ? (
        <p className="text-gray-500 text-center">Loading event data...</p>
      ) : !event ? (
        <p className="text-gray-400 text-center">No active event.</p>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-center">📋 {event.name}</h2>
          <p className="text-gray-600 text-sm text-center">{event.description}</p>

          <EventSettings event={event} setEvent={setEvent} />
          <ManageTasks tasks={tasks} setTasks={setTasks} teams={teams} eventId={event.id} />
          <TaskList tasks={tasks} teamTasks={teamTasks} teams={teams} markTaskCompleted={markTaskCompleted} reviewTask={reviewTask} />
          <ManageTeams teams={teams} setTeams={setTeams} users={users} eventId={event.id} /> {/* ✅ Pass users */}
          <TeamList teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
        </>
      )}
    </div>
  );
}
