import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { ScavengerTask, ScavengerSubmission, ScavengerTeam } from "@/types";

export function TaskSubmissionForm({
  tasks,
  selectedTeam,
  refreshSubmissions,
  refreshTasks,
}: {
  tasks: ScavengerTask[];
  selectedTeam: ScavengerTeam;
  refreshSubmissions: () => void;
  refreshTasks: () => void; 
}) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [media, setMedia] = useState<File | null>(null);
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      const { data } = await supabase.from("scavenger_submissions").select("*").eq("team_id", selectedTeam.id);
      setSubmissions(data || []);
    }
    fetchSubmissions();
  }, [selectedTeam]);

  async function handleSubmit() {
    if (!taskId || !media) {
      setError("Velg en oppgave og last opp et bilde!");
      return;
    }

    setError(null);
    setSuccess(null);

    const filePath = `${selectedTeam.id}/${taskId}-${Date.now()}.${media.name.split(".").pop()}`;
    const { error: uploadError } = await supabase.storage.from("scavenger-feed").upload(filePath, media);

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      setError("Kunne ikke laste opp filen. Prøv igjen.");
      return;
    }

    const { data } = supabase.storage.from("scavenger-feed").getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const { error: submissionError } = await supabase.from("scavenger_submissions").insert([
      {
        task_id: taskId,
        team_id: selectedTeam.id,
        media_url: publicUrl,
        status: "pending",
        submitted_at: new Date().toISOString(),
      },
    ]);

    if (submissionError) {
      console.error("❌ Error submitting:", submissionError);
      setError("Kunne ikke sende inn oppgaven.");
    } else {
      setSuccess("✅ Oppgaven er sendt inn!");
      setTaskId(null);
      setMedia(null);

      refreshSubmissions();
      refreshTasks();
    }
  }

  function isRejected(taskId: string) {
    const sub = submissions.find((sub) => sub.task_id === taskId);
    return sub?.status === "rejected" ? `❌ Avvist: ${sub.judge_comment || "Ingen kommentar"}` : null;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-5 mt-5 w-full max-w-2xl">
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">📤 Send inn oppgave</h3>

      {/* Error message */}
      {error && <p className="text-red-600 bg-red-100 p-2 rounded mb-3">{error}</p>}
      
      {/* Success message */}
      {success && <p className="text-green-600 bg-green-100 p-2 rounded mb-3">{success}</p>}

      {/* Task selection */}
      <label className="block font-medium text-gray-700">Velg oppgave:</label>
      <select
        className="border border-gray-300 p-3 w-full rounded-md mt-1 focus:ring-2 focus:ring-blue-400"
        value={taskId || ""}
        onChange={(e) => setTaskId(e.target.value)}
      >
        <option value="">Velg en oppgave</option>
        {tasks.map((task) => {
          const sub = submissions.find((sub) => sub.task_id === task.id);
          const isDisabled = sub && sub.status !== "rejected";
          return (
            <option key={task.id} value={task.id} disabled={isDisabled}>
              {task.title} {isRejected(task.id) && `(${isRejected(task.id)})`}
            </option>
          );
        })}
      </select>

      {/* File upload */}
      <div className="mt-4">
        <label className="block font-medium text-gray-700">Last opp bilde:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setMedia(e.target.files?.[0] || null)}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-900 text-center font-medium py-2 px-4 rounded-md block mt-2"
        >
          📷 Velg bilde
        </label>
        {media && <p className="text-sm text-gray-600 mt-1">🖼️ {media.name}</p>}
      </div>

      {/* Submit button */}
      <button
        className={`w-full mt-4 py-2 rounded font-semibold text-white ${
          taskId && media ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
        }`}
        onClick={handleSubmit}
        disabled={!taskId || !media}
      >
        Send inn
      </button>
    </div>
  );
}
