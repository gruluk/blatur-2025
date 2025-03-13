import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../../supabase";
import Header from "@/components/Header";

type Achievement = {
  id: string;
  title: string;
  description: string;
  points: number;
};

type Submission = {
  achievement_id: string;
  status: string;
};

export default function Submit() {
  const { user } = useUser();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, string>>({});
  const [totalPoints, setTotalPoints] = useState<number>(0); // ✅ Track total points

  useEffect(() => {
    async function fetchAchievements() {
      const { data, error } = await supabase.from("achievements").select("*");
      if (error) console.error("❌ Error fetching achievements:", error);
      else setAchievements(data);
    }

    async function fetchUserSubmissions() {
      if (!user) return;
      const { data, error } = await supabase
        .from("submissions")
        .select("achievement_id, status")
        .eq("user_id", user.id);

      if (error) console.error("❌ Error fetching submissions:", error);
      else {
        const statusMap: Record<string, string> = {};
        data.forEach((sub: Submission) => {
          statusMap[sub.achievement_id] = sub.status; // "pending" or "approved"
        });
        setSubmissionStatus(statusMap);
      }
    }

    async function fetchTotalPoints() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("scores")
        .select("points")
        .eq("user_id", user.id);

      if (error) {
        console.error("❌ Error fetching total points:", error);
      } else {
        // ✅ Sum all points
        const total = data.reduce((sum, entry) => sum + entry.points, 0);
        setTotalPoints(total);
      }
    }

    fetchAchievements();
    fetchUserSubmissions();
    fetchTotalPoints(); // ✅ Fetch total points
  }, [user]);

  return (
    <div className="min-h-screen bg-onlineBlue text-white p-6 mt-15">
      <Header />
      <div className="min-h-screen text-white flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Achievements</h1>
        
        {/* 🔥 Display User’s Total Points */}
        <p className="text-xl font-bold mb-4">🏆 Total Points: {totalPoints}</p> {/* ✅ Show total score */}

        {/* 🔥 List of Achievements */}
        <div className="w-full max-w-lg space-y-3">
          {achievements.map((achievement) => {
            const status = submissionStatus[achievement.id] || "not-done"; // Default: Not Done
            const isPending = status === "pending";
            const isCompleted = status === "approved";

            return (
              <button
                key={achievement.id}
                className="w-full px-6 py-3 bg-white text-onlineBlue font-bold rounded-lg flex justify-between items-center"
                onClick={() => router.push(`/achievement/${achievement.id}`)}
              >
                {/* 🏆 Achievement Title & Points (Left) */}
                <div className="text-left">
                  <p>{achievement.title}</p>
                  <p className="text-sm text-gray-600">{achievement.points} pts</p>
                </div>

                {/* ✅ Status (Right) */}
                <div className="text-right font-semibold">
                  {isCompleted ? (
                    <span className="text-green-600">✅ Done</span>
                  ) : isPending ? (
                    <span className="text-yellow-600">⌛ Pending</span>
                  ) : (
                    <span className="text-red-600">❌ Not Done</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
