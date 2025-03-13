import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";

type Submission = {
  id: string;
  user_id: string;
  achievement_id: string;
  proof_url: string | null;
  submission_text: string | null;
  created_at: string;
  achievements: {
    title: string;
    points: number;
  };
  user: {
    name: string;
  };
};

export default function JudgeReview() {
  const router = useRouter();
  const { id } = router.query;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    async function fetchSubmission() {
      if (!id) return;

      const { data, error } = await supabase
        .from("submissions")
        .select("*, achievements(title, points), status")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Error fetching submission:", error);
        return;
      }

      let userData = { name: "Unknown User" }; // Default value in case user fetch fails

      try {
        const res = await fetch(`/api/get-user?userId=${data.user_id}`);
        if (res.ok) {
          userData = await res.json();
        }
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
      }

      setSubmission({ ...data, user: userData }); // ✅ Merge user into submission
      setLoading(false);
    }

    fetchSubmission();
  }, [id]);

  async function deleteSubmission() {
    if (!submission) return;

    const { error } = await supabase
      .from("submissions")
      .update({ status: "pending" })
      .eq("id", submission.id);

    if (error) {
      console.error("❌ Error deleting submission:", error);
      return;
    }

    alert("✅ Judgment deleted!");
    setStatus("pending"); // Reset UI
  }

  async function updateSubmission(status: "approved" | "rejected", reason: string) {
    if (!submission) return;

    const { error: updateError } = await supabase
      .from("submissions")
      .update({ status })
      .eq("id", submission.id);

    if (updateError) {
      console.error("❌ Error updating submission:", updateError);
      return;
    }

    if (status === "approved") {
      const points = submission.achievements.points;

      // ✅ Insert into `scores` table
      const { error: scoreError } = await supabase.from("scores").insert([
        {
          user_id: submission.user_id,
          event_type: "Achievement",
          event_id: submission.achievement_id,
          points,
        },
      ]);

      if (scoreError) {
        console.error("❌ Error updating score:", scoreError);
        return;
      }

      // ✅ Create a feed post announcing the achievement
      let postContent = `🎉 ${submission.user.name} just earned +${points} points for completing "${submission.achievements.title}"!`;
      
      if (reason) {
        postContent += `\n\n📝 Judge's Comment: "${reason}"`;
      }
      
      const { error: postError } = await supabase.from("posts").insert([
        {
          user_id: submission.user_id,
          username: submission.user.name,
          content: postContent,
          image_urls: submission.proof_url ? [submission.proof_url] : [],
          video_urls: [],
          is_announcement: false,
          event_type: "Achievement",
        },
      ]);

      if (postError) {
        console.error("❌ Error creating feed post:", postError);
        return;
      }

    } else if (status === "rejected") {
        // ✅ Remove the score if it was previously approved
        const { error: deleteScoreError } = await supabase
          .from("scores")
          .delete()
          .eq("user_id", submission.user_id)
          .eq("event_id", submission.achievement_id)
          .eq("event_type", "Achievement");

        if (deleteScoreError) {
          console.error("❌ Error deleting score:", deleteScoreError);
          return;
        }

        // ✅ Improved Formatting for Feed Post
        let postContent = `❌ ${submission.user.name}'s achievement "${submission.achievements.title}" has been revoked.`;

        if (submission.submission_text) {
          postContent += `\n\n📝 Submission: "${submission.submission_text}"`; // Include submission text
        }

        if (reason) {
          postContent += `\n\n🗒 Judge's Comment: "${reason}"`; // Add Judge's Comment at the bottom
        }

        const { error: revokePostError } = await supabase.from("posts").insert([
          {
            user_id: submission.user_id,
            username: submission.user.name,
            content: postContent,
            image_urls: submission.proof_url ? [submission.proof_url] : [], // Attach proof image if available
            video_urls: submission.proof_url?.endsWith(".mp4") ? [submission.proof_url] : [],
            is_announcement: false,
            event_type: "Achievement Revoked",
          },
        ]);

        if (revokePostError) {
          console.error("❌ Error creating revocation post:", revokePostError);
          return;
        }
      }

    alert(`✅ Submission ${status.toUpperCase()}!`);
    router.push("/judge");
  }

  if (loading) return <p className="text-white">Loading submission...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold">{submission?.achievements.title}</h1>
      <p className="text-gray-400">🏆 {submission?.achievements.points} Points</p>
      <p className="text-gray-300">👤 Submitted by: {submission?.user?.name || "Unknown User"}</p>
      <p className="text-sm text-gray-500">
        🕒 {submission?.created_at ? new Date(submission.created_at).toLocaleString() : "Unknown Date"}
      </p>

      {/* 🔥 Show current status */}
      <p className={`text-lg font-bold ${status === "approved" ? "text-green-500" : status === "rejected" ? "text-red-500" : "text-gray-500"}`}>
        Status: {status ? status.toUpperCase() : "Pending"}
      </p>

      {/* 🔥 Display submission text */}
      {submission?.submission_text && (
        <p className="mt-4 text-gray-300 border p-2 rounded-lg">{submission.submission_text}</p>
      )}

      {/* 🔥 Display media (image/video) */}
      {submission?.proof_url && (
        submission.proof_url.endsWith(".mp4") ? (
          <video controls className="mt-4 rounded-lg max-w-md">
            <source src={submission.proof_url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img src={submission.proof_url} alt="Proof" className="mt-4 rounded-lg max-w-md" />
        )
      )}

      <textarea
        className="w-full p-2 border rounded-lg text-black"
        placeholder="Enter reason for approval/rejection..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      {/* 🔥 Action buttons for judge */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => updateSubmission("approved", reason)}
          className={`px-4 py-2 rounded-lg ${status === "approved" ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          disabled={status === "approved"}
        >
          ✅ Approve
        </button>

        <button
          onClick={() => updateSubmission("rejected", reason)}
          className={`px-4 py-2 rounded-lg ${status === "rejected" ? "bg-gray-600 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
          disabled={status === "rejected"}
        >
          ❌ Reject
        </button>
        <button
          onClick={() => deleteSubmission()}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
        >
          🗑 Delete Judgment
        </button>
      </div>

      {/* 🔥 Back to Judge Panel */}
      <button
        onClick={() => router.push("/judge")}
        className="mt-6 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
      >
        🔙 Back to Judge Panel
      </button>
    </div>
  );
}
