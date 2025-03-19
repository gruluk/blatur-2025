import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../../supabase";
import Header from "@/components/Header";
import ScavengerHuntCard from "@/components/ScavengerHuntCard";

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
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [isScavengerHuntLive, setIsScavengerHuntLive] = useState<boolean>(false); // ✅ Track event status

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
          statusMap[sub.achievement_id] = sub.status;
        });
        setSubmissionStatus(statusMap);
      }
    }

    async function fetchTotalPoints() {
      if (!user) return;

      try {
        const { data: scoreData, error: scoreError } = await supabase
          .from("scores")
          .select("points")
          .eq("user_id", user.id);

        if (scoreError) throw scoreError;

        const totalScorePoints = scoreData.reduce((sum, entry) => sum + entry.points, 0);

        const { data: bonusData, error: bonusError } = await supabase
          .from("bonus_points")
          .select("points")
          .eq("user_id", user.id);

        if (bonusError) throw bonusError;

        const totalBonusPoints = bonusData.reduce((sum, entry) => sum + entry.points, 0);
        setTotalPoints(totalScorePoints + totalBonusPoints);
      } catch (error) {
        console.error("❌ Error fetching total points:", error);
      }
    }

    async function fetchScavengerHuntStatus() {
      const { data, error } = await supabase
        .from("scavenger_events")
        .select("status")
        .single(); // ✅ Assuming there’s only one event

      if (error) {
        console.error("❌ Error fetching scavenger hunt status:", error);
      } else {
        setIsScavengerHuntLive(data?.status === "live");
      }
    }

    fetchAchievements();
    fetchUserSubmissions();
    fetchTotalPoints();
    fetchScavengerHuntStatus(); // ✅ Check scavenger hunt event status
  }, [user]);

    return (
      <div className="min-h-screen bg-onlineBlue text-white p-6 mt-15">
        <Header />
        <div className="min-h-screen text-white flex flex-col items-center">

          {/* ✅ Show Scavenger Hunt Card only if live */}
          {isScavengerHuntLive && <ScavengerHuntCard />}

          <h1 className="text-3xl font-bold mt-6 mb-4">Achievements</h1>

          <p className="text-xl font-bold mb-4">🏆 Your Total Points: {totalPoints}</p>

          {/* 🔥 List of Achievements */}
          <div className="w-full max-w-lg space-y-3">
            {achievements.map((achievement) => {
              const status = submissionStatus[achievement.id] || "not-done";
              const isPending = status === "pending";
              const isCompleted = status === "approved";

              return (
                <button
                  key={achievement.id}
                  className="w-full px-6 py-3 font-bold bg-white text-onlineBlue rounded-lg flex flex-col text-left"
                  onClick={() => router.push(`/achievement/${achievement.id}`)} // ✅ Always clickable
                >
                  <p>{achievement.title}</p>
                  <p className="text-sm text-gray-600">{achievement.points} pts</p>

                  {/* Status Tag */}
                  <span
                    className={`mt-1 px-2 py-1 text-xs font-semibold rounded-md w-fit ${
                      isCompleted
                        ? "bg-green-200 text-green-800"
                        : isPending
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {isCompleted ? "✅ Done" : isPending ? "⌛ Pending" : "❌ Not Done"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
}
