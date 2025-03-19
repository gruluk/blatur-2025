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
  const [bonusPoints, setBonusPoints] = useState(0); // 🎖️ Extra points input

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
      setStatus(data.status);
      setLoading(false);
    }

    fetchSubmission();
  }, [id]);

  async function updateSubmission(status: "approved" | "rejected", reason: string) {
    if (!submission) return;

    const isVideo = submission.proof_url ? /\.(mp4|webm|ogg)$/i.test(submission.proof_url) : false;
    const imageUrls = submission.proof_url && !isVideo ? [submission.proof_url] : [];
    const videoUrls = isVideo ? [submission.proof_url] : [];

    console.log("📷 Image URLs:", imageUrls);
    console.log("🎥 Video URLs:", videoUrls);

    const { error: updateError } = await supabase
      .from("submissions")
      .update({ status })
      .eq("id", submission.id);

    if (updateError) {
      console.error("❌ Error updating submission:", updateError);
      return;
    }

    if (status === "approved") {
      const totalPoints = submission.achievements.points + bonusPoints;

      // ✅ Insert into `scores`
      const { error: scoreError } = await supabase.from("scores").insert([
        {
          user_id: submission.user_id,
          event_type: "Achievement",
          event_id: submission.achievement_id,
          points: totalPoints,
        },
      ]);

      if (scoreError) {
        console.error("❌ Error updating score:", scoreError);
        return;
      }

      // ✅ Create a feed post announcing the achievement
      let postContent = `🎉 ${submission.user.name} just earned +${totalPoints} points for completing "${submission.achievements.title}"!`;
      if (bonusPoints > 0) postContent += ` (Includes +${bonusPoints} bonus points) 🎖️`;
      if (reason) postContent += `\n\n📝 Judge's Comment: "${reason}"`;

      const { error: postError } = await supabase.from("posts").insert([
        {
          user_id: submission.user_id,
          username: submission.user.name,
          content: postContent,
          image_urls: imageUrls,
          video_urls: videoUrls,
          is_announcement: false,
          event_type: "Achievement",
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

  if (loading) {
    return (
      <div className="min-h-screen text-white p-6 flex flex-col items-center">
        <Header />
        <h1 className="text-3xl font-bold text-center mb-6 mt-15">⚖️ Dommer dømmer</h1>
        <Skeleton className="h-12 w-1/2 mb-4" />
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

        {submission?.submission_text && (
          <p className="mt-4 text-gray-700 border p-3 rounded-lg bg-gray-100">📝 {submission.submission_text}</p>
        )}

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

        <p className="mt-4 text-lg font-bold">
          {status ? `Status: ${status.toUpperCase()}` : "⌛ Pending Review"}
        </p>

        {/* 🎖️ Bonus Points Input */}
        <div className="mt-4 bg-gray-100 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-onlineBlue">🎖️ Give Bonus Points</h3>
          <input
            type="number"
            placeholder="Bonus Points"
            value={bonusPoints}
            onChange={(e) => setBonusPoints(Number(e.target.value))}
            className="mt-2 p-2 border border-gray-300 rounded-lg w-24 text-onlineBlue"
          />
        </div>

        {/* 📝 Judge's Comment Input */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-onlineBlue">📝 Dommer kommentar</h3>
          <textarea
            className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-onlineBlue h-24 resize-none"
            placeholder="Enter reason for approval/rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)} // ✅ This ensures `setReason` is used
          />
        </div>

        <button onClick={() => updateSubmission("approved", reason)} className="mt-4 bg-green-600 px-4 py-2 rounded-lg">
          ✅ Approve
        </button>
        <button onClick={() => updateSubmission("rejected", reason)} className="mt-2 bg-red-600 px-4 py-2 rounded-lg">
          ❌ Reject
        </button>
      </div>
    </div>
  );
}
