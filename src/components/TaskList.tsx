import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { ScavengerTask, ScavengerSubmission } from "@/types";

export function TaskList({ tasks, teamId }: { tasks: ScavengerTask[]; teamId: string }) {
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);

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

    fetchSubmissions();
  }, [teamId]);

  // ✅ Function to get submission status
  function getStatus(taskId: string) {
    const submission = submissions.find((sub) => sub.task_id === taskId);
    if (!submission) return "❌ Not Submitted";
    if (submission.status === "pending") return "⏳ Pending";
    if (submission.status === "approved") return "✅ Approved";
    return `❌ Rejected (${submission.judge_comment || "No comment"})`;
  }

  return (
    <div>
      <h3 className="mt-4 text-lg font-semibold">📜 Tasks</h3>
      <ul className="list-disc ml-5">
        {tasks.length === 0 ? (
          <p>No tasks assigned yet.</p>
        ) : (
          tasks.map((task) => (
            <li key={task.id} className="flex justify-between items-center">
              <span>
                {task.title} - {task.points} pts
              </span>
              <span className="text-sm italic">{getStatus(task.id)}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
