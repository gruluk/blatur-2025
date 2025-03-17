import { GetServerSideProps } from "next";
import { useState } from "react";
import { supabase } from "../../../../supabase";
import { useSession } from "@clerk/nextjs";
import Header from "@/components/Header";
import NotInTeam from "@/components/ScavengerHunt/NotInTeam";
import TeamInfo from "@/components/ScavengerHunt/TeamInfo";
import TeamTaskList from "@/components/ScavengerHunt/TeamTaskList";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Get the scavenger hunt event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("type", "scavenger-hunt")
    .single();

  // 🔥 If event is missing or hidden, redirect user
  if (eventError || !event || event.status === "hidden") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  // Fetch all scavenger hunt tasks
  const { data: tasks } = await supabase
    .from("scavenger_hunt_tasks")
    .select("*")
    .eq("event_id", event.id);

  return { props: { event, tasks: tasks || [] } };
};

export default function ScavengerHuntPage({ event, tasks }) {
  const { session } = useSession();
  const [taskList, setTaskList] = useState(tasks);
  const [userTeam, setUserTeam] = useState(null);
  const [teamTasks, setTeamTasks] = useState([]);

  if (!event) return <div>No active scavenger hunt at the moment.</div>;

  // 🔥 Fetch the user’s team & their task progress
  async function fetchUserTeam() {
    if (!session) return;

    const { user } = session;
    const { data: teams } = await supabase
      .from("teams")
      .select("*")
      .contains("user_ids", [user.id]);

    if (teams?.length === 0) return; // ❌ User is not in a team

    setUserTeam(teams[0]);

    // 🔥 Fetch the team’s task progress
    const { data: teamTaskData } = await supabase
      .from("scavenger_hunt_team_tasks")
      .select("*")
      .eq("team_id", teams[0].id);

    setTeamTasks(teamTaskData || []);
  }

  useState(() => {
    fetchUserTeam();
  }, [session]);

  if (!userTeam) return <NotInTeam />;

  const markAsCompleted = async (taskId) => {
    const { error } = await supabase
      .from("scavenger_hunt_team_tasks")
      .update({ completed: true })
      .eq("task_id", taskId)
      .eq("team_id", userTeam.id);

    if (!error) {
      setTeamTasks((prev) =>
        prev.map((task) =>
          task.task_id === taskId ? { ...task, completed: true } : task
        )
      );
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
      <Header />
      <div className="p-6 bg-white shadow-md rounded-lg w-full mt-20">
        <h1 className="text-2xl font-bold text-center">{event.name}</h1>
        <p className="text-gray-600 text-center">{event.description}</p>
      </div>

      <TeamInfo teamName={userTeam.name} />

      <TeamTaskList tasks={tasks} teamTasks={teamTasks} userTeamId={userTeam.id} setTeamTasks={setTeamTasks} />

    </div>
  );
}
