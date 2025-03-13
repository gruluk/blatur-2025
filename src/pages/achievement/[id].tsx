import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../../../supabase";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

type Achievement = {
  id: string;
  title: string;
  description: string;
  points: number;
  images: string[];
};

export default function AchievementDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { id } = router.query;
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [latestSubmission, setLatestSubmission] = useState<{
    proof_url?: string | null;
    submission_text?: string | null;
  } | null>(null);

  useEffect(() => {
    async function fetchAchievement() {
      if (!id) return;
      const { data, error } = await supabase.from("achievements").select("*").eq("id", id).single();
      if (error) console.error("❌ Error fetching achievement:", error);
      else setAchievement({ ...data, images: data.images ?? [] });
    }

    async function fetchSubmissionStatus() {
      if (!id || !user) return;
      const { data, error } = await supabase
        .from("submissions")
        .select("status, proof_url, submission_text")
        .eq("achievement_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("❌ Error fetching submission status:", error);
      } else {
        setSubmissionStatus(data?.status === "rejected" ? null : data?.status || null);
        setLatestSubmission(data || null);
      }
    }

    fetchAchievement();
    fetchSubmissionStatus();
  }, [id, user]);

  async function handleUpload() {
    if (!user || !achievement) return;
    setUploading(true);

    let publicUrl = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, file);
      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        setUploading(false);
        return;
      }

      publicUrl = supabase.storage.from("uploads").getPublicUrl(fileName).data.publicUrl;
      if (!publicUrl) {
        console.error("❌ Failed to retrieve public URL");
        setUploading(false);
        return;
      }
    }

    const { error: insertError } = await supabase.from("submissions").insert([
      {
        user_id: user.id,
        achievement_id: achievement.id,
        proof_url: publicUrl,
        submission_text: submissionText,
        status: "pending",
        judge_comment: null,
      },
    ]);

    if (insertError) {
      console.error("❌ Error inserting submission:", insertError);
    } else {
      alert("✅ Submission uploaded! Pending review.");
      setSubmissionStatus("pending");
      setFile(null);
      setSubmissionText("");
    }

    setUploading(false);
  }

  return (
    <div className="min-h-screen bg-[#0D5474] text-white p-6">
      <Header />
      <div className="flex flex-col items-center text-center mt-10">
        {achievement ? (
          <div className="w-full max-w-2xl bg-white text-[#0D5474] p-6 rounded-lg shadow-md">
            {/* 🔥 Only Show Image if Available */}
            {achievement.images.length > 0 && (
              <img
                src={achievement.images[0]}
                alt="Achievement Preview"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}

            {/* 🔥 Achievement Header */}
            <h1 className="text-3xl font-bold">{achievement.title}</h1>
            <p className="text-gray-600 mt-2">{achievement.description}</p>
            <p className="mt-4 text-lg font-bold">🏆 {achievement.points} Points</p>

            {/* 🔥 Submission Status */}
            {submissionStatus === "approved" && (
              <p className="mt-4 text-green-600 font-bold">✅ You have completed this achievement!</p>
            )}
            {submissionStatus === "pending" && (
              <p className="mt-4 text-yellow-500 font-bold">⌛ Your submission is pending review.</p>
            )}

            {/* 🔥 Display Latest Submission */}
            {latestSubmission && (submissionStatus === "pending" || submissionStatus === "approved") && (
              <div className="mt-6 bg-gray-100 text-[#0D5474] p-4 rounded-lg shadow-md">
                <h3 className="font-bold">
                  {submissionStatus === "pending" ? "Your Pending Submission" : "Your Approved Submission"}
                </h3>

                {latestSubmission.submission_text && (
                  <p className="mt-2">📝 {latestSubmission.submission_text}</p>
                )}

                {latestSubmission.proof_url && (
                  <div className="mt-4 flex flex-col items-center">
                    {latestSubmission.proof_url.endsWith(".mp4") ? (
                      <video controls className="rounded-lg max-w-full">
                        <source src={latestSubmission.proof_url} type="video/mp4" />
                      </video>
                    ) : (
                      <img
                        src={latestSubmission.proof_url}
                        alt="Submission"
                        className="rounded-lg max-w-full"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 🔥 Submission Section */}
            <div className="mt-6">
              <h3 className="text-xl font-bold">Submit Your Attempt</h3>

              <textarea
                className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-[#0D5474] h-24 resize-none"
                placeholder="Write a description for your submission..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                disabled={!!submissionStatus}
              ></textarea>

              {/* Styled File Upload */}
              <label className="w-full flex flex-col items-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg cursor-pointer hover:bg-blue-700 mt-2">
                📸 Choose Image/Video
                <input
                  type="file"
                  accept="image/*, video/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={!!submissionStatus}
                />
              </label>

              {file && <p className="text-sm mt-2 text-gray-500">Selected: {file.name}</p>}

              <Button
                onClick={handleUpload}
                disabled={uploading || !!submissionStatus}
                className="w-full bg-[#F9B759] hover:bg-yellow-500 text-[#0D5474] font-bold mt-4"
              >
                {uploading ? "Uploading..." : "📸 Submit Attempt"}
              </Button>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
