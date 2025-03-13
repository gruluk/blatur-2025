import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";

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

      let userData = { name: "Unknown User" };

      try {
        const res = await fetch(`/api/get-user?userId=${data.user_id}`);
        if (res.ok) {
          userData = await res.json();
        }
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
      }

      setSubmission({ ...data, user: userData });

      // ✅ Fix: Update the status state
      setStatus(data.status);  

      setLoading(false);
    }

    fetchSubmission();
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen text-white p-6 flex flex-col items-center">
        <Header />
        <h1 className="text-3xl font-bold text-center mb-6 mt-15">⚖️ Dommer dømmer</h1>

        <div className="w-full max-w-2xl bg-white text-onlineBlue p-6 rounded-lg shadow-md">
          <Skeleton className="h-6 w-3/4 mb-4" /> 
          <Skeleton className="h-4 w-1/2 mb-2" /> 
          <Skeleton className="h-4 w-2/3 mb-2" /> 
          <Skeleton className="h-4 w-1/3 mb-4" /> 

          <Skeleton className="h-20 w-full rounded-lg mb-4" /> 

          <Skeleton className="h-48 w-full rounded-lg mb-4" /> 

          <Skeleton className="h-10 w-full mb-4" /> 

          <Skeleton className="h-12 w-full mb-2" /> 
          <Skeleton className="h-12 w-full" /> 
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center">
      <Header />
      <h1 className="text-3xl font-bold text-center mb-6 mt-15">⚖️ Dommer dømmer</h1>

      <div className="w-full max-w-2xl bg-white text-onlineBlue p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold">{submission?.achievements.title}</h2>
        <p className="text-gray-600">🏆 {submission?.achievements.points} Points</p>
        <p className="text-gray-500">👤 Submitted by: {submission?.user?.name || "Unknown User"}</p>
        <p className="text-xs text-gray-400">🕒 {submission?.created_at ? new Date(submission.created_at).toLocaleString() : "Unknown Date"}</p>

        {/* 🔥 Show Submission Content */}
        {submission?.submission_text && (
          <p className="mt-4 text-gray-700 border p-3 rounded-lg bg-gray-100">
            📝 {submission.submission_text}
          </p>
        )}

        {/* 🔥 Display media (image/video) */}
        {submission?.proof_url && (
          <div className="mt-4 flex flex-col items-center">
            {submission.proof_url.endsWith(".mp4") ? (
              <video controls className="rounded-lg max-w-full">
                <source src={submission.proof_url} type="video/mp4" />
              </video>
            ) : (
              <img src={submission.proof_url} alt="Proof" className="rounded-lg max-w-full" />
            )}
          </div>
        )}

        {/* 🔥 Status and Judge's Comment */}
        <p className={`mt-4 text-lg font-bold ${status === "approved" ? "text-green-600" : status === "rejected" ? "text-red-600" : "text-yellow-500"}`}>
          {status ? `Status: ${status.toUpperCase()}` : "⌛ Pending Review"}
        </p>

        <textarea
          className="w-full p-2 border rounded-lg text-black mt-4"
          placeholder="Enter reason for approval/rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* 🔥 Action Buttons */}
        <div className="mt-6 flex flex-col space-y-2">
          <button
            onClick={() => updateSubmission("approved", reason)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-50"
            disabled={status === "approved"}
          >
            ✅ Approve
          </button>

          <button
            onClick={() => updateSubmission("rejected", reason)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white disabled:opacity-50"
            disabled={status === "rejected"}
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </div>
  );
}
