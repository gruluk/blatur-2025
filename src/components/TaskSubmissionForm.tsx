import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { ScavengerTask, ScavengerSubmission, ScavengerTeam } from "@/types";

export function TaskSubmissionForm({
  tasks,
  selectedTeam,
}: {
  tasks: ScavengerTask[];
  selectedTeam: ScavengerTeam;
}) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);

  // ✅ Fetch existing submissions
  useEffect(() => {
    async function fetchSubmissions() {
      const { data } = await supabase.from("scavenger_submissions").select("*").eq("team_id", selectedTeam.id);
      setSubmissions(data || []);
    }
    fetchSubmissions();
  }, [selectedTeam]);

  async function handleSubmit() {
    if (!taskId || !media) return alert("Please select a task and upload media.");

    // ✅ Upload file
    const filePath = `scavenger_media/${selectedTeam.id}/${taskId}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from("scavenger_media").upload(filePath, media);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return;
    }

    // ✅ Store submission
    const { error: submissionError } = await supabase.from("scavenger_submissions").insert([
      {
        task_id: taskId,
        team_id: selectedTeam.id,
        media_url: filePath,
        status: "pending",
        submitted_at: new Date().toISOString(),
      },
    ]);

    if (submissionError) {
      console.error("Error submitting:", submissionError);
    } else {
      alert("Submission sent!");
      setTaskId(null);
      setMedia(null);
    }
  }

  // ✅ Check if task has a rejected submission
  function isRejected(taskId: string) {
    const sub = submissions.find((sub) => sub.task_id === taskId);
    return sub?.status === "rejected" ? `❌ Rejected: ${sub.judge_comment || "No reason given"}` : null;
  }

  return (
    <div>
      <h3 className="mt-4 text-lg font-semibold">📤 Submit Task</h3>
      <select className="border p-2 w-full" value={taskId || ""} onChange={(e) => setTaskId(e.target.value)}>
        <option value="">Select a task</option>
        {tasks.map((task) => {
            const sub = submissions.find((sub) => sub.task_id === task.id);
            const isDisabled = sub && sub.status !== "rejected"; // ✅ Disable if submitted and not rejected
            return (
            <option key={task.id} value={task.id} disabled={isDisabled}>
                {task.title} {isRejected(task.id) && `(${isRejected(task.id)})`}
            </option>
            );
        })}
      </select>

      <input type="file" accept="image/*" onChange={(e) => setMedia(e.target.files?.[0] || null)} className="mt-2" />
      <button className="bg-green-500 text-white px-4 py-2 rounded mt-2" onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}
