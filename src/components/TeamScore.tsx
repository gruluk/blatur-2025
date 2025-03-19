import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

export function TeamScore({ teamId }: { teamId: string }) {
  const [score, setScore] = useState(0);

  async function fetchScore() {
    const { data, error } = await supabase
        .from("scavenger_submissions")
        .select("task_id, status, points_awarded, scavenger_tasks(points)") // ✅ Use points_awarded
        .eq("team_id", teamId)
        .eq("status", "approved");

    if (error) {
        console.error("🚨 Error fetching team score:", error);
        return;
    }

    console.log("✅ Score Calculation Data:", JSON.stringify(data, null, 2));

    // ✅ Debug each submission
    data.forEach((submission) => {
        console.log(`🔍 Submission Task ID: ${submission.task_id}`);
        console.log(`➡️  Points Awarded: ${submission.points_awarded}`);
        console.log(`➡️  Task Points: ${submission.scavenger_tasks?.[0]?.points}`);
    });

    // ✅ Ensure adjusted points are counted
    const totalPoints = (data || []).reduce((sum, submission) => {
        const task = Array.isArray(submission.scavenger_tasks)
        ? submission.scavenger_tasks[0] // ✅ Extract first item if it's an array
        : submission.scavenger_tasks;

        // ✅ Use points_awarded if available, otherwise fallback to task points (Fix `||` vs `??` issue)
        const points = submission.points_awarded !== null && submission.points_awarded !== undefined
        ? submission.points_awarded
        : task?.points ?? 0;

        console.log("🔢 Adding Points:", points);
        return sum + points;
    }, 0);

    console.log("🎯 New Team Score:", totalPoints);
    setScore(totalPoints);
  }

  useEffect(() => {
    console.log("Fetching team score for team:", teamId);
    fetchScore();

    const subscription = supabase
      .channel("scavenger_submissions")
      .on("postgres_changes", { event: "*", schema: "public", table: "scavenger_submissions" }, fetchScore)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [teamId]);

  return (
    <div className="bg-blue-500 text-white p-4 rounded-lg text-center font-bold text-lg">
      🎯 Team Score: {score} points
    </div>
  );
}
