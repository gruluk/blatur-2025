import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { ScavengerTask, ScavengerSubmission } from "@/types";

export function TaskList({ tasks, teamId }: { tasks: ScavengerTask[]; teamId: string }) {
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);

  // ✅ Fetch submissions for the team
  useEffect(() => {
    async function fetchSubmissions() {
      const { data, error } = await supabase
        .from("scavenger_submissions")
        .select("*")
        .eq("team_id", teamId);

      if (error) {
        console.error("Error fetching submissions:", error);
      } else {
        setSubmissions(data || []);
      }
    }

    if (teamId) {
      fetchSubmissions();
    }
  }, [teamId]);

  // ✅ Get the status for a given task
  const getTaskStatus = (taskId: string) => {
    const submission = submissions.find((sub) => sub.task_id === taskId);

    if (!submission) return { status: "Not Started", color: "text-gray-500" }; // No submission yet
    if (submission.status === "approved") return { status: "✅ Approved", color: "text-green-500" };
    if (submission.status === "pending") return { status: "⏳ Pending", color: "text-yellow-500" };
    if (submission.status === "rejected") return { status: "❌ Rejected - Try Again", color: "text-red-500" };

    return { status: "Unknown", color: "text-gray-500" };
  };

  return (
    <div>
      <h3 className="mt-4 text-lg font-semibold">📜 Tasks</h3>
      <ul className="list-disc ml-5">
        {tasks.length === 0 ? (
          <p>No tasks assigned yet.</p>
        ) : (
          tasks.map((task) => {
            const { status, color } = getTaskStatus(task.id);
            return (
              <li key={task.id} className="flex justify-between items-center">
                <span>{task.title} - {task.points} pts</span>
                <span className={`ml-4 font-bold ${color}`}>{status}</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
