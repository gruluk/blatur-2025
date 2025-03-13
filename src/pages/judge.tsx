import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../supabase";
import Header from "@/components/Header";

type Submission = {
  id: string;
  user_id: string;
  achievement_id: string;
  created_at: string;
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
          achievements!inner (
            title,
            points
          )
        `) // ✅ Ensures `achievements` is a single object, not an array
        .eq("status", "pending");

      if (error) {
        console.error("❌ Supabase Error:", error);
        return;
      }

      // 🔥 Convert `achievements` to a single object if needed
      const formattedSubmissions = data.map((submission) => ({
        ...submission,
        achievements: Array.isArray(submission.achievements)
          ? submission.achievements[0] || { title: "Unknown", points: 0 } // ✅ Fix array issue
          : submission.achievements, // ✅ Use directly if already an object
      }));

      // 🔥 Fetch user details from our API route
      const submissionsWithUsers = await Promise.all(
        formattedSubmissions.map(async (submission) => {
          try {
            const res = await fetch(`/api/get-user?userId=${submission.user_id}`);
            const userData = await res.json();
            return { ...submission, user: userData };
          } catch (err) {
            console.error("❌ Error fetching user data:", err);
            return { ...submission, user: { name: "Unknown User" } };
          }
        })
      );

      setSubmissions(submissionsWithUsers);
      setLoading(false);
    }

    fetchSubmissions();
  }, []);

  if (loading) return <p className="text-white">Loading submissions...</p>;

  return (
    <div className="min-h-screen text-white p-6 mt-5">
      <Header />

      <ul className="mt-6">
        {submissions.map((submission) => (
          <li key={submission.id} className="py-4 border-b">
            <h2 className="text-lg font-bold">{submission.achievements.title}</h2> {/* ✅ Now shows correct title */}
            <p className="text-gray-400">🏆 {submission.achievements.points} Points</p> {/* ✅ Now shows correct points */}
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
    </div>
  );
}
