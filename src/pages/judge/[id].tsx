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

  useEffect(() => {
    async function fetchSubmission() {
      if (!id) return;

      const { data, error } = await supabase
        .from("submissions")
        .select("*, achievements(title, points)")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Error fetching submission:", error);
        return;
      }

      // 🔥 Fetch user details from API route
      try {
        const res = await fetch(`/api/get-user?userId=${data.user_id}`);
        const userData = await res.json();
        setSubmission({ ...data, user: userData });
      } catch (err) {
        console.error("❌ Error fetching user data:", err);
        setSubmission({ ...data, user: { name: "Unknown User" } });
      }

      setLoading(false);
    }

    fetchSubmission();
  }, [id]);

  async function updateSubmission(status: "approved" | "rejected") {
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

        // ✅ Fetch user's name for the post
        let username = "Unknown User";
        try {
        const res = await fetch(`/api/get-user?userId=${submission.user_id}`);
        const userData = await res.json();
        username = userData.name || "Unknown User";
        } catch (err) {
        console.error("❌ Error fetching user name:", err);
        }

        // ✅ Construct post content with text and points
        let postContent = `🎉 ${username} just earned +${points} points for completing "${submission.achievements.title}"!`;
        if (submission.submission_text) {
        postContent += `\n\n📝 Submission: "${submission.submission_text}"`; // Include submission text
        }

        // ✅ Create a feed post announcing the achievement
        const { error: postError } = await supabase.from("posts").insert([
        {
            user_id: submission.user_id,
            username,
            content: postContent,
            image_urls: submission.proof_url ? [submission.proof_url] : [], // Attach submission image if available
            video_urls: [], // No videos from achievements currently
            is_announcement: false, // Not an admin announcement
        },
        ]);

        if (postError) {
        console.error("❌ Error creating feed post:", postError);
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
      <p className="text-gray-300">👤 Submitted by: {submission?.user.name}</p>
      <p className="text-sm text-gray-500">
        🕒 {submission?.created_at ? new Date(submission.created_at).toLocaleString() : "Unknown Date"}
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

      {/* 🔥 Action buttons for judge */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => updateSubmission("approved")}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          ✅ Approve
        </button>
        <button
          onClick={() => updateSubmission("rejected")}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          ❌ Reject
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
