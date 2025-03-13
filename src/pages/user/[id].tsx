import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { supabase } from "../../../supabase"; // ✅ Import Supabase
import Header from "@/components/Header";

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  createdAt: number;
  lastSignInAt: number | null;
};

type ScoreEntry = {
  id: string;
  event_type: string;
  event_id: string;
  points: number;
  created_at: string;
  achievement_title?: string;
  proof_url?: string | null;
  submission_text?: string | null;
  status: "approved" | "rejected"; // ✅ Add status
};

export default function UserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    if (!id) return;

    async function fetchUserData() {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) throw new Error("User not found");
        const data = await response.json();
        console.log("✅ User Data:", data);
        setUser(data);
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
      }
    }

    async function fetchUserScores() {
      try {
        // ✅ Fetch scores (approved achievements)
        const { data: scores, error: scoresError } = await supabase
          .from("scores")
          .select("id, event_type, event_id, points, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false });

        if (scoresError) throw scoresError;

        // ✅ Fetch all submissions (both approved and rejected)
        const { data: submissions, error: submissionsError } = await supabase
          .from("submissions")
          .select("id, achievement_id, status, proof_url, submission_text, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false });

        if (submissionsError) throw submissionsError;

        // ✅ Fetch achievement titles
        const achievementIds = submissions.map((sub) => sub.achievement_id);
        const { data: achievements, error: achievementsError } = await supabase
          .from("achievements")
          .select("id, title")
          .in("id", achievementIds);

        if (achievementsError) throw achievementsError;

        const achievementMap = Object.fromEntries(
          achievements.map((ach) => [ach.id, ach.title])
        );

        // ✅ Merge scores (approved) and submissions (all statuses)
        const allEntries = submissions
          .filter((sub) => sub.status !== "pending") // ✅ Hide pending submissions
          .map((sub) => {
            const matchingScore = scores.find((score) => score.event_id === sub.achievement_id);
            return {
              id: sub.id,
              event_type: "Achievement",
              event_id: sub.achievement_id,
              points: matchingScore ? matchingScore.points : 0,
              created_at: sub.created_at,
              achievement_title: achievementMap[sub.achievement_id] || "Unknown Achievement",
              proof_url: sub.proof_url,
              submission_text: sub.submission_text,
              status: sub.status,
            };
          });

        setScoreBreakdown(allEntries);
        setTotalPoints(scores.reduce((sum, entry) => sum + entry.points, 0)); // ✅ Sum approved points only
      } catch (error) {
        console.error("❌ Error fetching user scores:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    fetchUserScores();
  }, [id]);

  if (loading) return <p className="text-center text-white">Loading user...</p>;
  if (!user) return <p className="text-center text-white">User not found</p>;

  return (
    <div className="min-h-screen bg-onlineBlue text-white p-6 mt-15">
      <Header />
      <div className="max-w-xl mx-auto bg-white text-onlineBlue p-6 rounded-lg shadow-md flex flex-col items-center">
        {/* 🔥 Profile Image */}
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={`${user.firstName || "User"}'s profile`}
            width={100}
            height={100}
            className="rounded-full mb-4 border-2 border-onlineBlue"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
            No Image
          </div>
        )}

        {/* 🔥 User Details */}
        <h1 className="text-2xl font-bold">{user.firstName || "Unknown"} {user.lastName || ""}</h1>

        {/* 🏆 Total Points */}
        <p className="text-lg font-bold mt-4">🏆 Total Points: {totalPoints}</p>

        {/* 🔥 Score Breakdown */}
        <div className="mt-4 w-full">
          <h2 className="text-lg font-bold">Score Breakdown</h2>
          {scoreBreakdown.length === 0 ? (
            <p className="text-gray-500">No points earned yet.</p>
          ) : (
            <ul className="mt-2">
              {scoreBreakdown.map((entry) => (
                <li key={entry.id} className="text-sm text-gray-600 border-b py-2">
                  <span className={`font-bold ${entry.status === "approved" ? "text-green-600" : "text-red-600"}`}>
                    {entry.status === "approved" ? `+${entry.points} points` : "❌ Revoked"}
                  </span>{" "}
                  for <span className="text-onlineBlue">{entry.achievement_title}</span>

                  {/* Display Date */}
                  <br />
                  <span className="text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>

                  {/* 🔥 Submission Text */}
                  {entry.submission_text && (
                    <p className="mt-2 text-gray-700 text-sm border p-2 rounded-lg bg-gray-100">
                      <strong>Submission:</strong> {entry.submission_text}
                    </p>
                  )}

                  {/* 🔥 Proof (Image/Video) */}
                  {entry.proof_url && (
                    <div className="mt-2">
                      {entry.proof_url.endsWith(".mp4") ? (
                        <video controls className="rounded-lg max-w-full">
                          <source src={entry.proof_url} type="video/mp4" />
                        </video>
                      ) : (
                        <img src={entry.proof_url} alt="Submission" className="rounded-lg max-w-full" />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
