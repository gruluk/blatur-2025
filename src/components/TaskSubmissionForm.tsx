import { useState } from "react";
import { supabase } from "../../supabase";
import { ScavengerTask, ScavengerTeam } from "@/types";

interface TaskSubmissionFormProps {
  tasks: ScavengerTask[];
  selectedTeam: ScavengerTeam;
}

export function TaskSubmissionForm({ tasks, selectedTeam }: TaskSubmissionFormProps) {
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSubmit() {
    if (!selectedTask || !file) {
      alert("Please select a task and upload a file.");
      return;
    }

    setUploading(true);

    // ✅ Check if there is already a pending submission for this task
    const { data: existingSubmission, error: existingError } = await supabase
      .from("scavenger_submissions")
      .select("*")
      .eq("task_id", selectedTask)
      .eq("team_id", selectedTeam.id)
      .eq("status", "pending");

    if (existingError) {
      console.error("Error checking existing submissions:", existingError);
      setUploading(false);
      return;
    }

    if (existingSubmission && existingSubmission.length > 0) {
      alert("You already have a pending submission for this task!");
      setUploading(false);
      return;
    }

    // ✅ Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const filePath = `submissions/${selectedTeam.id}/${selectedTask}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("scavenger_media")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      setUploading(false);
      return;
    }

    // ✅ Get public URL
    const { data: publicURLData } = supabase.storage.from("scavenger_media").getPublicUrl(filePath);
    const mediaUrl = publicURLData.publicUrl;

    // ✅ Insert submission into database
    const { error: insertError } = await supabase.from("scavenger_submissions").insert([
      {
        task_id: selectedTask,
        team_id: selectedTeam.id,
        media_url: mediaUrl,
        submitted_at: new Date().toISOString(),
        status: "pending",
      },
    ]);

    if (insertError) {
      console.error("Error inserting submission:", insertError);
      setUploading(false);
      return;
    }

    alert("Submission uploaded successfully! Waiting for approval.");
    setSelectedTask("");
    setFile(null);
    setUploading(false);
  }

  return (
    <div className="p-4 bg-gray-100 rounded-md shadow">
      <h3 className="text-lg font-semibold">📤 Submit Task Proof</h3>

      {/* Task Selection */}
      <label className="block mt-2">Select Task:</label>
      <select
        className="w-full border p-2 rounded"
        value={selectedTask}
        onChange={(e) => setSelectedTask(e.target.value)}
      >
        <option value="">-- Select a Task --</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>

      {/* File Upload */}
      <label className="block mt-2">Upload Proof:</label>
      <input
        type="file"
        accept="image/*,video/*"
        className="w-full border p-2 rounded"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {/* Submit Button */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-3 w-full disabled:bg-gray-400"
        onClick={handleSubmit}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Submit Proof"}
      </button>
    </div>
  );
}
