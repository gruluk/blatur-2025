import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { ScavengerTask, ScavengerSubmission } from "@/types";

// Define statuses with icons and better styling
const STATUS_MAP = {
  not_submitted: { text: "Ikke gjort", color: "bg-gray-500", icon: "❌" },
  pending: { text: "Venter på dommer", color: "bg-yellow-500", icon: "⏳" },
  approved: { text: "Godkjent", color: "bg-green-500", icon: "✅" },
  rejected: { text: "Avvist", color: "bg-red-500", icon: "🚫" },
};

export function TaskList({ tasks, teamId }: { tasks: ScavengerTask[]; teamId: string }) {
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);

  async function fetchSubmissions() {
    const { data, error } = await supabase
      .from("scavenger_submissions")
      .select("*")
      .eq("team_id", teamId);

    if (error) {
      console.error("🚨 Error fetching submissions:", error);
      return;
    }

    setSubmissions(data || []);
  }

  useEffect(() => {
    fetchSubmissions();

    const subscription = supabase
      .channel("scavenger_submissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "scavenger_submissions" }, () => {
        fetchSubmissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [teamId]);

  function getStatus(taskId: string) {
    const submission = submissions.find((sub) => sub.task_id === taskId);

    if (!submission) return { ...STATUS_MAP.not_submitted, comment: null };
    if (submission.status === "pending") return { ...STATUS_MAP.pending, comment: null };
    if (submission.status === "approved") return { ...STATUS_MAP.approved, comment: null };
    return { ...STATUS_MAP.rejected, comment: submission.judge_comment || "Ingen kommentar" };
  }

  return (
    <div className="mt-6 px-4 w-full max-w-3xl mx-auto">
      <h3 className="text-2xl font-semibold text-white mb-4">📜 Oppgaver</h3>

      {tasks.length === 0 ? (
        <p className="text-gray-300">Ingen oppgaver tildelt ennå.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const { text, color, icon, comment } = getStatus(task.id);
            return (
              <div key={task.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
                {/* ✅ Make title wrap naturally */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-900 break-words">{task.title}</p>
                    <p className="text-sm text-gray-500">{task.points} poeng</p>
                  </div>

                  {/* ✅ Badge stays in place */}
                  <div className={`flex items-center gap-2 px-3 py-1 text-white text-sm font-semibold rounded-full ${color} mt-2 sm:mt-0`}>
                    <span>{icon}</span>
                    <span className="whitespace-nowrap">{text}</span>
                  </div>
                </div>

                {/* ✅ Judge comment appears under the badge if rejected */}
                {comment && (
                  <p className="mt-2 text-sm text-red-600 italic">💬 Dommerens kommentar: {comment}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
