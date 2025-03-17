import { useState, useEffect } from "react";
import { supabase } from "../../../../supabase";
import Header from "@/components/Header";
import EventSettings from "@/components/ScavengerHunt/EventSettings";
import ManageTeams from "@/components/ScavengerHunt/ManageTeams";
import ManageTasks from "@/components/ScavengerHunt/ManageTasks";
import TeamList from "@/components/ScavengerHunt/TeamList"; // ✅ Correct usage

export default function JudgeScavengerHuntPage() {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);


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
      try {
        const response = await fetch("/api/users"); // 🔥 Fetch user data from Clerk API
        const usersData = await response.json();

        if (!Array.isArray(usersData)) {
          console.error("❌ Error: Invalid user data:", usersData);
          return;
        }

        const userMap = usersData.reduce((acc, user) => {
          acc[user.id] = { firstName: user.firstName, lastName: user.lastName };
          return acc;
        }, {});

        setUsers(userMap);
      } catch (error) {
        console.error("❌ Error fetching users:", error);
      }
    }

    fetchEventData();
    fetchUsers();
  }, []);

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
          <ManageTasks tasks={tasks} setTasks={setTasks} eventId={event.id} />

          {/* ✅ Correctly Render `TeamList` (Only Once) */}
          <TeamList
            teams={teams}
            setTeams={setTeams}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            users={users}
            tasks={tasks}
            teamTasks={teamTasks} // ✅ Pass task statuses for each team
          />

          <ManageTeams teams={teams} setTeams={setTeams} users={users} eventId={event.id} />
        </>
      )}
    </div>
  );
}
