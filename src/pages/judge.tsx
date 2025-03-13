import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../supabase";
import Header from "@/components/Header";

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
        .neq("status", "pending"); // Get approved/rejected

      if (judgedError) {
        console.error("❌ Supabase Error (Judged):", judgedError);
        return;
      }

      // 🔥 Fetch user details separately
      const allUserIds = [...new Set([...data.map((s) => s.user_id), ...judgedData.map((s) => s.user_id)])];

      const usersResponse = await fetch("/api/getUserAvatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: allUserIds }),
      });

      const users = await usersResponse.json();

      // Merge user data into submissions
      const submissionsWithUsers = data.map((submission) => ({
        ...submission,
        user: { name: users[submission.user_id] || "Unknown User" },
      }));

      const judgedWithUsers = judgedData.map((submission) => ({
        ...submission,
        user: { name: users[submission.user_id] || "Unknown User" },
      }));

      setSubmissions(submissionsWithUsers);
      setJudgedSubmissions(judgedWithUsers);
      setLoading(false);
    }

    fetchSubmissions();
  }, []);

  if (loading) return <p className="text-white">Loading submissions...</p>;

  return (
    <div className="min-h-screen text-white p-6 mt-15">
      <Header />

      {/* 🔥 Pending Submissions */}
      <h2 className="text-xl font-bold">🕒 Pending Submissions</h2>
      <ul className="mt-6">
        {submissions.map((submission) => (
          <li key={submission.id} className="py-4 border-b">
            <h2 className="text-lg font-bold">{submission.achievements.title}</h2>
            <p className="text-gray-400">🏆 {submission.achievements.points} Points</p>
            <p className="text-gray-300">👤 Submitted by: {submission.user.name}</p>
            <p className="text-sm text-gray-500">
              🕒 {submission.created_at ? new Date(submission.created_at).toLocaleString() : "Unknown Date"}
            </p>

            <Link href={`/judge/${submission.id}`}>
              <button className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                🔍 Review Submission
              </button>
            </Link>
          </li>
        ))}
      </ul>
      
      {/* 🔥 Old Judgments */}
      <h2 className="mt-10 text-xl font-bold">📜 Past Judgments</h2>
      <ul className="mt-4">
        {judgedSubmissions.map((submission) => (
          <li key={submission.id} className="py-4 border-b">
            <h2 className="text-lg font-bold">{submission.achievements.title}</h2>
            <p className="text-gray-400">🏆 {submission.achievements.points} Points</p>
            <p className="text-gray-300">👤 Submitted by: {submission.user.name}</p>
            <p className={`text-sm font-bold ${submission.status === "approved" ? "text-green-500" : "text-red-500"}`}>
              {submission.status.toUpperCase()}
            </p>
            <Link href={`/judge/${submission.id}`}>
              <button className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                ✏ Edit Judgment
              </button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
