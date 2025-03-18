import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { useRouter } from "next/router";

interface ScavengerSubmission {
  id: string;
  task_id: string;
  team_id: string;
  media_url: string;
}

interface ScavengerTask {
  id: string;
  title: string;
}

interface ScavengerTeam {
  id: string;
  name: string;
}

export default function ScavengerJudging() {
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);
  const [tasks, setTasks] = useState<ScavengerTask[]>([]);
  const [teams, setTeams] = useState<ScavengerTeam[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      // ✅ Fetch pending submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("scavenger_submissions")
        .select("*")
        .eq("status", "pending");

      if (submissionsError) console.error("Error fetching submissions:", submissionsError);
      else setSubmissions(submissionsData || []);

      // ✅ Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase.from("scavenger_tasks").select("id, title");
      if (tasksError) console.error("Error fetching tasks:", tasksError);
      else setTasks(tasksData || []);

      // ✅ Fetch teams
      const { data: teamsData, error: teamsError } = await supabase.from("scavenger_teams").select("id, name");
      if (teamsError) console.error("Error fetching teams:", teamsError);
      else setTeams(teamsData || []);
    }

    fetchData();
  }, []);

  // ✅ Group submissions by team for better readability
  const submissionsByTeam = submissions.reduce((acc, sub) => {
    if (!acc[sub.team_id]) acc[sub.team_id] = [];
    acc[sub.team_id].push(sub);
    return acc;
  }, {} as Record<string, ScavengerSubmission[]>);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">📷 Pending Submissions</h3>
      {Object.keys(submissionsByTeam).length === 0 ? (
        <p>No pending submissions.</p>
      ) : (
        <ul className="space-y-4">
          {Object.entries(submissionsByTeam).map(([teamId, teamSubmissions]) => {
            const teamName = teams.find((t) => t.id === teamId)?.name || "Unknown Team";
            return (
              <li key={teamId} className="p-4 bg-gray-800 text-white rounded">
                <h4 className="text-lg font-semibold">🏆 {teamName}</h4>
                <ul className="mt-2 space-y-2">
                  {teamSubmissions.map((submission) => {
                    const taskTitle = tasks.find((t) => t.id === submission.task_id)?.title || "Unknown Task";
                    return (
                      <li key={submission.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                        <span>📜 {taskTitle}</span>
                        <div className="flex space-x-2">
                          <a
                            href={submission.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline"
                          >
                            View Media
                          </a>
                          <button
                            className="bg-blue-500 px-3 py-1 rounded"
                            onClick={() => router.push(`/scavenger-hunt/team/${submission.team_id}`)}
                          >
                            👀 Review
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
