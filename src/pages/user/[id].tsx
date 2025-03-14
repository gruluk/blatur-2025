import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { supabase } from "../../../supabase"; // ✅ Import Supabase
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/utils/time";

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
        // ✅ Fetch approved submissions first
        const { data: submissions, error: submissionsError } = await supabase
          .from("submissions")
          .select("id, achievement_id, status, proof_url, submission_text, created_at")
          .eq("user_id", id)
          .eq("status", "approved") // Only approved submissions
          .order("created_at", { ascending: false });

        if (submissionsError) throw submissionsError;

        // ✅ Extract achievement IDs
        const achievementIds = submissions.map((sub) => sub.achievement_id);

        // ✅ Fetch related scores from `scores` table using achievement IDs
        const { data: submissionScores, error: scoresError } = await supabase
          .from("scores")
          .select("event_id, points")
          .in("event_id", achievementIds) // ✅ Use achievement IDs, not submission IDs
          .eq("event_type", "Achievement"); // ✅ Match event_type correctly

        if (scoresError) throw scoresError;

        // ✅ Create a map of event_id -> points
        const scoreMap = Object.fromEntries(
          submissionScores.map((score) => [score.event_id, score.points])
        );

        // ✅ Fetch achievement titles
        const { data: achievements, error: achievementsError } = await supabase
          .from("achievements")
          .select("id, title")
          .in("id", achievementIds);

        if (achievementsError) throw achievementsError;

        const achievementMap = Object.fromEntries(
          achievements.map((ach) => [ach.id, ach.title])
        );

        const { data: bonusPoints, error: bonusPointsError } = await supabase
          .from("bonus_points")
          .select("id, points, granted_at, reason, proof_url") // ✅ Include reason & proof_url
          .eq("user_id", id)
          .order("granted_at", { ascending: false });

        if (bonusPointsError) throw bonusPointsError;

        // ✅ Format Submissions (Achievements)
        const formattedSubmissions = submissions.map((sub) => ({
          id: sub.id,
          event_type: "Achievement",
          event_id: sub.achievement_id,
          points: scoreMap[sub.achievement_id] || 0, // ✅ Fetch points from `scores`
          created_at: sub.created_at,
          achievement_title: achievementMap[sub.achievement_id] || "Unknown Achievement",
          proof_url: sub.proof_url,
          submission_text: sub.submission_text,
          status: sub.status,
        }));

        // ✅ Format Bonus Points to Include Reason & Proof Image
        const formattedBonusPoints = bonusPoints.map((bonus) => ({
          id: bonus.id,
          event_type: "Bonus Points",
          event_id: "Bonus",
          points: bonus.points,
          created_at: bonus.granted_at,
          achievement_title: "Bonus Points",
          proof_url: bonus.proof_url || null, // ✅ Ensure proof_url is included
          submission_text: bonus.reason || null, // ✅ Store reason under submission_text for display
          status: "approved",
        }));

        // ✅ Merge Both Lists & Sort by Date
        const allEntries = [...formattedSubmissions, ...formattedBonusPoints].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // ✅ Calculate total points correctly
        const total = allEntries.reduce((sum, entry) => sum + entry.points, 0);

        // ✅ Update State
        setScoreBreakdown(allEntries);
        setTotalPoints(total);
      } catch (error) {
        console.error("❌ Error fetching user scores:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    fetchUserScores();
  }, [id]);

  
  if (loading) {
    return (
      <div className="min-h-screen bg-onlineBlue text-white p-6 flex flex-col items-center">
        <Header />
        <div className="max-w-xl mx-auto bg-white text-onlineBlue p-6 rounded-lg shadow-md flex flex-col items-center">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />

          <Skeleton className="w-40 h-6 rounded-md" />

          <Skeleton className="w-32 h-5 mt-4 rounded-md" />

          <div className="mt-4 w-full space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
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
                    {formatRelativeTime(entry.created_at)}
                  </span>

                  {/* 🔥 Submission Text (For Achievements) */}
                  {entry.submission_text && (
                    <p className="mt-2 text-gray-700 text-sm border p-2 rounded-lg bg-gray-100">
                      <strong>Submission:</strong> {entry.submission_text}
                    </p>
                  )}

                  {/* 🔥 Bonus Point Reason */}
                  {entry.event_type === "Bonus Points" && entry.submission_text && (
                    <p className="mt-2 text-gray-700 text-sm border p-2 rounded-lg bg-gray-100">
                      <strong>Reason:</strong> {entry.submission_text}
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
                        <img src={entry.proof_url} alt="Proof" className="rounded-lg max-w-full" />
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
