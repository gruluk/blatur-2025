import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../supabase";

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  points: number;
};

export default function Leaderboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);

        // 🔥 Fetch users from Clerk API
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();

        if (!Array.isArray(usersData)) {
          console.error("❌ usersData is not an array:", usersData);
          return;
        }

        console.log("✅ Fetched users:", usersData);

        // 🔥 Fetch achievement scores from Supabase
        const { data: scoresData, error: scoresError } = await supabase
          .from("scores")
          .select("user_id, points");

        if (scoresError) {
          console.error("❌ Error fetching scores:", scoresError);
          return;
        }

        console.log("✅ Fetched scores:", scoresData);

        // 🔥 Fetch bonus points from Supabase
        const { data: bonusData, error: bonusError } = await supabase
          .from("bonus_points")
          .select("user_id, points");

        if (bonusError) {
          console.error("❌ Error fetching bonus points:", bonusError);
          return;
        }

        console.log("✅ Fetched bonus points:", bonusData);

        // 🔥 Create a map of user_id -> total points (Achievements + Bonus)
        const userPointsMap = new Map();

        // ✅ Add Achievement Points
        scoresData.forEach(({ user_id, points }) => {
          userPointsMap.set(user_id, (userPointsMap.get(user_id) || 0) + points);
        });

        // ✅ Add Bonus Points
        bonusData.forEach(({ user_id, points }) => {
          userPointsMap.set(user_id, (userPointsMap.get(user_id) || 0) + points);
        });

        // 🔥 Merge users with their total points
        const usersWithScores = usersData.map((user) => ({
          ...user,
          points: userPointsMap.get(user.id) || 0, // ✅ Default to 0 if no points
        }));

        // 🔥 Sort users by total points (highest first)
        usersWithScores.sort((a, b) => b.points - a.points);

        setUsers(usersWithScores);
      } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-onlineBlue text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold">🏆 Leaderboard</h1>
      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 w-full max-w-4xl">
          {users.map((user, index) => (
            <div
              key={user.id}
              className="bg-white text-onlineBlue p-4 rounded-lg shadow-md cursor-pointer transition hover:bg-gray-200"
              onClick={() => router.push(`/user/${user.id}`)}
            >
              <p className="font-bold text-lg">
                {index + 1}. {user.firstName || "Unknown"} {user.lastName || ""}
              </p>
              <p className="text-sm text-gray-600">🏆 {user.points} Points</p>
              <p className="text-xs text-gray-500">Click to view profile</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
