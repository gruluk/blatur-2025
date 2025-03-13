import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../../../supabase";
import Header from "@/components/Header";

type Achievement = {
  id: string;
  title: string;
  description: string;
  points: number;
};

export default function AchievementDetails() {
  const { user } = useUser();
  const router = useRouter();
  const { id } = router.query;
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState(""); // 🔥 New state for text input

  // 🔥 Fetch achievement details
  useEffect(() => {
    async function fetchAchievement() {
      if (!id) return;
      const { data, error } = await supabase.from("achievements").select("*").eq("id", id).single();
      if (error) console.error("❌ Error fetching achievement:", error);
      else setAchievement(data);
    }

    async function fetchSubmissionStatus() {
      if (!id || !user) return;
      const { data, error } = await supabase
        .from("submissions")
        .select("status")
        .eq("achievement_id", id)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("❌ Error fetching submission status:", error);
      } else {
        setSubmissionStatus(data?.status || null);
      }
    }

    fetchAchievement();
    fetchSubmissionStatus();
  }, [id, user]);

  // 🔥 Handle File Upload & Submission
  async function handleUpload() {
    if (!user || !achievement || submissionStatus) return;
    setUploading(true);

    let publicUrl = null;
    
    // ✅ Upload file if selected
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, file);
      if (uploadError) {
        console.error("❌ Upload error:", uploadError);
        setUploading(false);
        return;
      }

      // ✅ Get public URL
      publicUrl = supabase.storage.from("uploads").getPublicUrl(fileName).data.publicUrl;
      if (!publicUrl) {
        console.error("❌ Failed to retrieve public URL");
        setUploading(false);
        return;
      }
    }

    // ✅ Insert into `submissions` table
    const { error: insertError } = await supabase.from("submissions").insert([
      {
        user_id: user.id,
        achievement_id: achievement.id,
        proof_url: publicUrl, // File (optional)
        submission_text: submissionText, // 🔥 Store the text input
        status: "pending",
        judge_comment: null,
      },
    ]);

    if (insertError) console.error("❌ Error inserting submission:", insertError);
    else {
      alert("✅ Submission uploaded! Pending review.");
      setSubmissionStatus("pending");
      setFile(null);
      setSubmissionText(""); // 🔥 Reset text input
    }

    setUploading(false);
  }

  return (
    <div className="min-h-screen bg-onlineBlue text-white p-6">
      <Header />
      <div className="min-h-screen flex flex-col items-center text-center mt-15">
        {achievement ? (
          <>
            <h1 className="text-3xl font-bold">{achievement.title}</h1>
            <p className="text-gray-300 mt-2">{achievement.description}</p>
            <p className="mt-4 font-bold text-lg">🏆 {achievement.points} Points</p>

            {submissionStatus === "approved" && (
              <p className="mt-4 text-green-400 font-bold">✅ You have completed this achievement!</p>
            )}
            {submissionStatus === "pending" && (
              <p className="mt-4 text-yellow-400 font-bold">⌛ Your submission is pending review.</p>
            )}

            {/* 🔥 Text Input for Submission */}
            <textarea
              className="mt-4 w-full p-2 text-black rounded-lg"
              placeholder="Write a description for your submission..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              disabled={!!submissionStatus}
            ></textarea>

            {/* 🔥 File Upload */}
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-black mt-4"
              disabled={!!submissionStatus}
            />

            <button
              onClick={handleUpload}
              disabled={uploading || !!submissionStatus}
              className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "📸 Submit Attempt"}
            </button>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
