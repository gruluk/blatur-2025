import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../supabase";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";

type Submission = {
  id: string;
  user_id: string;
  achievement_id: string;
  created_at: string;
  status: string;
  achievements: {
    title: string;
    points: number;
  };
  user: {
    name: string;
  };
};

export default function JudgePanel() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [judgedSubmissions, setJudgedSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id,
          user_id,
          achievement_id,
          created_at,
          status,
          achievements!inner (
            title,
            points
          )
        `)
        .eq("status", "pending");

      if (error) {
        console.error("❌ Supabase Error:", error);
        return;
      }

      // Fetch past judgments (approved/rejected)
      const { data: judgedData, error: judgedError } = await supabase
        .from("submissions")
        .select(`
          id,
          user_id,
          achievement_id,
          created_at,
          status,
          achievements!inner (
            title,
            points
          )
        `)
        .neq("status", "pending");

      if (judgedError) {
        console.error("❌ Supabase Error (Judged):", judgedError);
        return;
      }

      // 🔥 Fetch Usernames the Same Way as `JudgeReview`
      async function fetchUserName(userId: string) {
        try {
          const res = await fetch(`/api/get-user?userId=${userId}`);
          if (res.ok) {
            return await res.json();
          }
        } catch (err) {
          console.error("❌ Error fetching user data:", err);
        }
        return { name: "Unknown User" }; // Default fallback
      }

      // Fetch usernames for all users
      const allUserIds = [...new Set([...data.map((s) => s.user_id), ...judgedData.map((s) => s.user_id)])];

      const userMap: Record<string, { name: string }> = {};
      for (const userId of allUserIds) {
        userMap[userId] = await fetchUserName(userId);
      }

      // Merge user data into submissions
      const submissionsWithUsers = data.map((submission) => ({
        ...submission,
        user: userMap[submission.user_id] || { name: "Unknown User" },
      }));

      const judgedWithUsers = judgedData.map((submission) => ({
        ...submission,
        user: userMap[submission.user_id] || { name: "Unknown User" },
      }));

      setSubmissions(submissionsWithUsers);
      setJudgedSubmissions(judgedWithUsers);
      setLoading(false);
    }

    fetchSubmissions();
  }, []);

  
  if (loading) {
    return (
      <div className="min-h-screen text-white p-6 mt-15 flex flex-col items-center">
        <Header />
        <h1 className="text-3xl font-bold text-center mb-6">⚖️ Dommerhjørnet</h1>

        <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
          {/* 🔥 Skeletons for Pending Submissions */}
          <h2 className="text-2xl font-bold text-center">🕒 Venter på dommer</h2>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full max-w-[600px] rounded-lg" />
          ))}

          {/* 🔥 Skeletons for Past Judgments */}
          <h2 className="mt-10 text-2xl font-bold text-center">📜 Tidligere dommer</h2>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full max-w-[600px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // 🔥 Sort past judgments (latest first)
  const sortedJudgedSubmissions = [...judgedSubmissions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen text-white p-6 mt-15">
      <Header />

      <h1 className="text-3xl font-bold text-center mb-6">⚖️ Dommerhjørnet</h1>

      <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
        {/* 🔥 Pending Submissions */}
        <h2 className="text-2xl font-bold text-center">🕒 Venter på dommer</h2>
        {submissions.map((submission) => (
          <Link className="w-full max-w-[600px]" key={submission.id} href={`/judge/${submission.id}`} passHref>
            <div className="p-4 rounded-lg shadow-md cursor-pointer w-full mx-auto bg-white text-onlineBlue">
              <h2 className="text-lg font-bold">{submission.achievements.title}</h2>
              <p className="text-gray-600">🏆 {submission.achievements.points} Points</p>
              <p className="text-gray-500">👤 Submitted by: {submission.user.name}</p>
              <p className="text-xs text-gray-400">
                🕒 {new Date(submission.created_at).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}

        {/* 🔥 Past Judgments */}
        <h2 className="mt-10 text-2xl font-bold text-center">📜 Tidligere dommer</h2>
        {sortedJudgedSubmissions.map((submission) => (
          <Link className="w-full max-w-[600px]" key={submission.id} href={`/judge/${submission.id}`} passHref>
            <div className="p-4 rounded-lg shadow-md cursor-pointer w-full mx-auto bg-white text-onlineBlue">
              <h2 className="text-lg font-bold">{submission.achievements.title}</h2>
              <p className="text-gray-600">🏆 {submission.achievements.points} Points</p>
              <p className="text-gray-500">👤 Submitted by: {submission.user.name}</p>
              <p className="text-xs text-gray-400">
                🕒 {new Date(submission.created_at).toLocaleString()}
              </p>
              <p className={`text-sm font-bold ${submission.status === "approved" ? "text-green-600" : "text-red-600"}`}>
                {submission.status.toUpperCase()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
