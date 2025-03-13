import { useEffect, useState } from "react";
import { useRouter } from "next/router";

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

        // 🔥 Fetch scores from Supabase
        const scoresRes = await fetch("/api/scores");
        const scoresData = await scoresRes.json();

        if (!Array.isArray(scoresData)) {
          console.error("❌ scoresData is not an array:", scoresData);
          return;
        }

        console.log("✅ Fetched scores:", scoresData);

        // 🔥 Merge users with scores
        const usersWithScores = usersData.map((user) => {
          const userScore = scoresData.find((score: { user_id: string }) => score.user_id === user.id);
          return { 
            ...user, 
            points: userScore?.total_points || 0
          };
        });

        // 🔥 Sort users by points (highest first)
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
