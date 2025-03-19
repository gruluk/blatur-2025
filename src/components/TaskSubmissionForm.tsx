import { useState, useEffect } from "react";
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
  const [files, setFiles] = useState<File[]>([]);
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function fetchSubmissions() {
      const { data } = await supabase.from("scavenger_submissions").select("*").eq("team_id", selectedTeam.id);
      setSubmissions(data || []);
    }
    fetchSubmissions();
  }, [selectedTeam]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  async function handleSubmit() {
    if (!taskId || files.length === 0) {
      setError("Velg en oppgave og last opp minst én fil!");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    const uploadedImageUrls: string[] = [];
    const uploadedVideoUrls: string[] = [];

    // 🔥 Upload each file
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${selectedTeam.id}/${taskId}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error } = await supabase.storage.from("scavenger-feed").upload(filePath, file);

      if (error) {
        console.error("❌ Upload error:", error);
        setError("Kunne ikke laste opp filene. Prøv igjen.");
        setIsUploading(false);
        return;
      }

      const { publicUrl } = supabase.storage.from("scavenger-feed").getPublicUrl(filePath).data;

      if (file.type.startsWith("image")) uploadedImageUrls.push(publicUrl);
      if (file.type.startsWith("video")) uploadedVideoUrls.push(publicUrl);
    }

    // 🔥 Insert submission into DB
    const { error: submissionError } = await supabase.from("scavenger_submissions").insert([
      {
        task_id: taskId,
        team_id: selectedTeam.id,
        media_url: uploadedImageUrls[0] || uploadedVideoUrls[0] || null, // ✅ Store the first uploaded media
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
      setFiles([]);
      refreshSubmissions();
      refreshTasks();
    }

    setIsUploading(false);
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
        className="border border-gray-300 p-3 w-full rounded-md mt-1 focus:ring-2 focus:ring-blue-400 text-lg max-w-full truncate"
        style={{ fontSize: "16px" }} // 🔥 Prevents mobile zoom
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
        <label className="block font-medium text-gray-700">Last opp bilder eller videoer:</label>
        <input
          id="file-upload"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-900 text-center font-medium py-2 px-4 rounded-md block mt-2"
        >
          📷📹 Velg filer
        </label>

        {/* Show selected files */}
        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="text-sm text-gray-600">
                {file.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit button */}
      <button
        className={`w-full mt-4 py-2 rounded font-semibold text-white ${
          taskId && files.length > 0 ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
        }`}
        onClick={handleSubmit}
        disabled={!taskId || files.length === 0 || isUploading}
      >
        {isUploading ? "Laster opp..." : "Send inn"}
      </button>
    </div>
  );
}
