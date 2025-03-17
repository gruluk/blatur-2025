import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../../../supabase";
import Header from "@/components/Header";
import { useUser } from "@clerk/nextjs";

export default function TaskSubmissionPage() {
  const router = useRouter();
  const { taskId } = router.query;
  const [task, setTask] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [file, setFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userTeamId, setUserTeamId] = useState(null);
  const [judgeComment, setJudgeComment] = useState("");
  
  const { user } = useUser();

  const isAdmin = user?.publicMetadata?.isAdmin;

  useEffect(() => {
    if (!taskId) return;

    async function fetchTaskDetails() {
    if (!taskId || !user) return;

    const { data: taskData } = await supabase.from("scavenger_hunt_tasks").select("*").eq("id", taskId).single();
    if (taskData) setTask(taskData);

    const { data: userTeam } = await supabase
        .from("teams")
        .select("id")
        .contains("user_ids", [user.id]) // ✅ Use Clerk's user.id
        .single();

    if (userTeam) {
        setUserTeamId(userTeam.id);

        const { data: submissionData } = await supabase
            .from("scavenger_hunt_team_tasks")
            .select("proof_url, submission_text, reviewed, judge_comment")
            .eq("task_id", taskId)
            .eq("team_id", userTeam.id)
            .single();

            setSubmission(submissionData || null);
    }
    }

    fetchTaskDetails();
  }, [taskId]);

  async function handleDecision(approved) {
    const { error } = await supabase
        .from("scavenger_hunt_team_tasks")
        .update({
        reviewed: true,
        approved: approved,
        judge_comment: judgeComment,
        })
        .eq("task_id", taskId)
        .eq("team_id", userTeamId);

    if (error) {
        console.error("❌ Error updating submission:", error);
        alert("Failed to update submission.");
    } else {
        alert("✅ Submission updated!");

        // 🔥 Fetch the updated submission to update the status correctly
        const { data: updatedSubmission, error: fetchError } = await supabase
        .from("scavenger_hunt_team_tasks")
        .select("proof_url, submission_text, reviewed, approved, judge_comment")
        .eq("task_id", taskId)
        .eq("team_id", userTeamId)
        .single();

        if (fetchError) {
        console.error("❌ Error fetching updated submission:", fetchError);
        } else {
        setSubmission(updatedSubmission); // ✅ Update state with fresh data
        }
    }
    }

  async function handleUpload() {
    if (!userTeamId || !file) return;
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const filePath = `scavenger_hunt/${userTeamId}/${taskId}.${fileExt}`;

    // ✅ Upload the file
    const { data, error: uploadError } = await supabase.storage
        .from("scavengerhuntsubmissions")
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        alert("Failed to upload file. Try again.");
        setUploading(false);
        return;
    }

    // ✅ Get Public URL Correctly
    const { publicUrl } = supabase.storage
        .from("scavengerhuntsubmissions")
        .getPublicUrl(filePath).data;

    if (!publicUrl) {
        console.error("❌ Failed to retrieve public URL");
        setUploading(false);
        return;
    }

    // ✅ Use UPSERT to Insert or Update the Submission
    const { error: upsertError } = await supabase
        .from("scavenger_hunt_team_tasks")
        .upsert([
            {
            task_id: taskId,
            team_id: userTeamId,
            completed: true,
            proof_url: publicUrl,
            submission_text: submissionText,
            reviewed: false, // Ensure it starts as not reviewed
            },
        ], { onConflict: ["task_id", "team_id"] }); // ✅ Ensure uniqueness

    if (upsertError) {
        console.error("❌ Error inserting/updating submission:", upsertError);
    } else {
        alert("✅ Submission uploaded! Pending review.");

        // ✅ Ensure UI updates correctly
        setSubmission({
        proof_url: publicUrl,
        submission_text: submissionText,
        reviewed: false, // Reset reviewed flag
        });
    }

    setUploading(false);
  }

  if (!task) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-[#0D5474] text-white p-6">
      <Header />
      <div className="max-w-2xl mx-auto bg-white text-[#0D5474] p-6 rounded-lg shadow-md mt-20">
        <h1 className="text-2xl font-bold">{task.task}</h1>

        {/* 🔥 Task Status */}
        <div className="mt-4 p-3 rounded-md text-center font-bold">
            {submission?.reviewed ? (
                submission?.approved ? (
                <p className="text-green-600">✅ Done</p>
                ) : (
                <p className="text-red-600">🚫 Rejected</p>
                )
            ) : submission?.proof_url ? (
                <p className="text-yellow-600">⏳ Pending Review</p>
            ) : (
                <p className="text-gray-600">❌ Not Done</p>
            )}
        </div>

        {/* 🔥 Submission Details */}
        {submission && (
          <div className="mt-4 bg-gray-100 p-3 rounded-md">
            <h4 className="font-bold">Your Latest Submission</h4>
            {submission.submission_text && <p>📝 {submission.submission_text}</p>}

            {submission.proof_url && (
              <div className="mt-2 flex flex-col items-center">
                {submission.proof_url.endsWith(".mp4") ? (
                  <video controls className="rounded-lg max-w-full">
                    <source src={submission.proof_url} type="video/mp4" />
                  </video>
                ) : (
                  <img src={submission.proof_url} alt="Submission" className="rounded-lg max-w-full" />
                )}
              </div>
            )}
          </div>
        )}

        {isAdmin && submission && (
            <div className="mt-6 bg-yellow-100 p-3 rounded-md">
                <h3 className="text-lg font-bold">Judge's Decision</h3>
                <textarea
                className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-[#0D5474] h-24 resize-none"
                placeholder="Leave a comment for the team..."
                value={judgeComment}
                onChange={(e) => setJudgeComment(e.target.value)}
                />
                <div className="flex justify-between mt-4">
                <button onClick={() => handleDecision(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">
                    ✅ Approve
                </button>
                <button onClick={() => handleDecision(false)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">
                    🚫 Reject
                </button>
                </div>
            </div>
        )}

        {/* 🔥 Judge Feedback */}
        {submission?.reviewed && (
          <div className="mt-4 bg-yellow-100 p-3 rounded-md">
            <h4 className="font-bold">Judge's Feedback</h4>
            <p>{submission.judge_comment || "No comment provided"}</p>
          </div>
        )}

        {/* 🔥 Submission Form */}
        {!submission?.approved && (
          <div className="mt-6">
            <h3 className="text-lg font-bold">Submit Your Attempt</h3>
            <textarea
              className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-[#0D5474] h-24 resize-none"
              placeholder="Write a description for your submission..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
            />

            {/* File Upload */}
            <label className="w-full flex flex-col items-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg cursor-pointer hover:bg-blue-700 mt-2">
              📸 Choose Image/Video
              <input
                type="file"
                accept="image/*, video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            {file && <p className="text-sm mt-2 text-gray-500">Selected: {file.name}</p>}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-[#F9B759] hover:bg-yellow-500 text-[#0D5474] font-bold mt-4 p-2 rounded-md"
            >
              {uploading ? "Uploading..." : "📸 Submit Attempt"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
