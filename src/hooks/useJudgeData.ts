import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

export type Submission = {
  id: string;
  user_id: string;
  achievement_id: string;
  created_at: string;
  status: string;
  users: { name: string };
  achievements: { title: string; points: number };
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  points: number;
  status: "pending" | "approved" | "rejected"; // ✅ Add status field
};

export type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  bonusPoints: number;
};

export function useJudgeData() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [judgedSubmissions, setJudgedSubmissions] = useState<Submission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // ✅ Fetch submissions from Supabase
      const { data: pendingData } = await supabase.from("submissions").select("*").eq("status", "pending");
      const { data: judgedData } = await supabase.from("submissions").select("*").neq("status", "pending");

      const pendingSubmissions = pendingData || [];
      const judgedSubmissions = judgedData || [];

      // ✅ Fetch achievements
      const { data: achievementsData } = await supabase.from("achievements").select("*");

      // 🔥 Create a map of achievements for easy lookup
      const achievementsMap: Record<string, { title: string; points: number }> =
        achievementsData?.reduce((acc, ach) => ({ ...acc, [ach.id]: { title: ach.title, points: ach.points } }), {}) || {};

      // ✅ Fetch all users from Clerk (instead of only submission users)
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();

      if (!Array.isArray(usersData)) {
        console.error("❌ usersData is not an array:", usersData);
        setLoading(false);
        return;
      }

      // ✅ Fetch bonus points from Supabase
      const { data: bonusPointsData } = await supabase.from("bonus_points").select("user_id, points");

      // 🔥 Create a bonus points map
      const bonusPointsMap: Record<string, number> =
        bonusPointsData?.reduce((acc, { user_id, points }) => {
          acc[user_id] = (acc[user_id] || 0) + points;
          return acc;
        }, {} as Record<string, number>) || {};

      // ✅ Format users
      const formattedUsers: User[] = usersData.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || "Unknown"} ${user.lastName || ""}`.trim(),
        bonusPoints: bonusPointsMap[user.id] || 0,
      }));

      // ✅ Format submissions
      const formatSubmissions = (submissions: Submission[]) =>
        submissions.map((submission) => ({
          ...submission,
          users: { name: formattedUsers.find((u) => u.id === submission.user_id)?.fullName || "Unknown User" },
          achievements: achievementsMap[submission.achievement_id] || { title: "Unknown Achievement", points: 0 },
        }));

      // ✅ Update state
      setSubmissions(formatSubmissions(pendingSubmissions));
      setJudgedSubmissions(
        formatSubmissions(judgedSubmissions).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
      setAchievements(achievementsData || []);
      setUsers(formattedUsers);
      setLoading(false);
    }

    fetchData();
  }, []);

  return { submissions, judgedSubmissions, achievements, users, loading, setAchievements };
}
