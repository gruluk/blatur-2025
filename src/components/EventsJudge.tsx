import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../supabase";

type Event = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "hidden" | "waiting" | "ongoing" | "done";
};

export default function EventsJudge() {
  const [event, setEvent] = useState<Event | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchScavengerHuntEvent() {
        const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("type", "scavenger-hunt")
        .order("start_date", { ascending: false }) // ✅ Show the most recent event first
        .limit(1) // ✅ Get only the latest scavenger hunt

        if (error) {
        console.error("❌ Error fetching scavenger hunt event:", error);
        return;
        }

        if (data.length > 0) {
        setEvent(data[0]); // ✅ Set the event, even if it's hidden
        }
    }

    fetchScavengerHuntEvent();
    }, []);

  return (
    <div className="w-full max-w-lg space-y-4 mx-auto mt-5">
      <h2 className="text-2xl font-bold text-center">📅 Manage Event</h2>

      {/* 🔥 If no event is available */}
      {!event ? (
        <p className="text-gray-400 text-center">No event available.</p>
      ) : (
        <div
          className="w-full px-6 py-4 bg-white text-onlineBlue font-bold rounded-lg flex flex-col items-center justify-between cursor-pointer shadow-md transition hover:bg-gray-100 border border-gray-300"
          onClick={() => router.push(`/judge/event/scavenger-hunt`)}
        >
          {/* 🔥 Event Title */}
          <h2 className="text-xl font-bold text-center">🔎 {event.name}</h2>

          {/* 📅 Event Dates */}
          <p className="text-gray-600 text-sm mt-2">
            📅 {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
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

          {/* 🔧 Manage Button */}
          <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Manage Event
          </button>
        </div>
      )}
    </div>
  );
}
