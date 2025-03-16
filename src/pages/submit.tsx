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

type Event = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "hidden" | "waiting" | "ongoing" | "done";
  type: string; // Added type field to determine event type (e.g., scavenger_hunt)
};

export default function Submit() {
  const { user } = useUser();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<Record<string, string>>({});
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"achievements" | "events">("achievements");
  const [events, setEvents] = useState<Event[]>([]);

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
        const { data: scoreData } = await supabase.from("scores").select("points").eq("user_id", user.id);
        const totalScorePoints = scoreData?.reduce((sum, entry) => sum + entry.points, 0) || 0;

        const { data: bonusData } = await supabase.from("bonus_points").select("points").eq("user_id", user.id);
        const totalBonusPoints = bonusData?.reduce((sum, entry) => sum + entry.points, 0) || 0;

        setTotalPoints(totalScorePoints + totalBonusPoints);
      } catch (error) {
        console.error("❌ Error fetching total points:", error);
      }
    }

    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .neq("status", "hidden") // ✅ Only fetch events that are NOT hidden
        .order("start_date", { ascending: true });

      if (error) {
        console.error("❌ Error fetching events:", error);
        return;
      }

      setEvents(data);
    }

    fetchAchievements();
    fetchUserSubmissions();
    fetchTotalPoints();
    fetchEvents(); // ✅ Fetch events dynamically
  }, [user]);

  return (
    <div className="min-h-screen bg-onlineBlue text-white p-6 mt-15">
      <Header />
      <div className="min-h-screen text-white flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4">Achievements</h1>

        {/* 🔥 Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("achievements")}
            className={`px-4 py-2 font-bold rounded-lg ${
              activeTab === "achievements" ? "bg-white text-onlineBlue" : "bg-gray-500 text-white"
            }`}
          >
            🏆 Achievements
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 font-bold rounded-lg ${
              activeTab === "events" ? "bg-white text-onlineBlue" : "bg-gray-500 text-white"
            }`}
          >
            📅 Events
          </button>
        </div>

        {/* 🔥 Achievements Tab */}
        {activeTab === "achievements" && (
          <>
            <p className="text-xl font-bold mb-4">🏆 Your Total Points: {totalPoints}</p>

            <div className="w-full max-w-lg space-y-3">
              {achievements.map((achievement) => {
                const status = submissionStatus[achievement.id] || "not-done";
                return (
                  <button
                    key={achievement.id}
                    className="w-full px-6 py-3 bg-white text-onlineBlue font-bold rounded-lg flex justify-between items-center"
                    onClick={() => router.push(`/achievement/${achievement.id}`)}
                  >
                    <div className="text-left">
                      <p>{achievement.title}</p>
                      <p className="text-sm text-gray-600">{achievement.points} pts</p>
                    </div>

                    <div className="text-right font-semibold">
                      {status === "approved" ? (
                        <span className="text-green-600">✅ Done</span>
                      ) : status === "pending" ? (
                        <span className="text-yellow-600">⌛ Pending</span>
                      ) : (
                        <span className="text-red-600">❌ Not Done</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 🔎 Events Tab */}
        {activeTab === "events" && (
          <div className="w-full max-w-lg space-y-3">
            {events.length === 0 ? (
              <p className="text-gray-300 text-center">No events available.</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="w-full px-6 py-4 bg-white text-onlineBlue font-bold rounded-lg flex flex-col items-center justify-between cursor-pointer shadow-md transition hover:bg-gray-100 border border-gray-300"
                  onClick={() => router.push(`/events/${event.type}`)}
                >
                  {/* 🔥 Event Title */}
                  <h2 className="text-xl font-bold text-center">📅 {event.name}</h2>

                  {/* 📅 Event Dates */}
                  <p className="text-gray-600 text-sm mt-2">
                    📅 {new Date(event.start_date).toLocaleDateString()} -{" "}
                    {new Date(event.end_date).toLocaleDateString()}
                  </p>

                  {/* 🏁 Event Status */}
                  <p
                    className={`mt-2 text-sm font-semibold px-3 py-1 inline-block rounded-md ${
                      event.status === "waiting"
                        ? "bg-yellow-200 text-yellow-800"
                        : event.status === "ongoing"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {event.status === "waiting"
                      ? "⏳ Waiting to Start"
                      : event.status === "ongoing"
                      ? "🚀 Ongoing Event"
                      : "✅ Completed"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
