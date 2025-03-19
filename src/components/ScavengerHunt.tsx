import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { useUser } from "@clerk/nextjs";
import ScavengerTasks from "./ScavengerTasks";
import ScavengerTeams from "./ScavengerTeams";

export default function ScavengerHunt() {
  const { user } = useUser();
  const [isLive, setIsLive] = useState<boolean>(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isAdmin = (user?.publicMetadata as { isAdmin?: boolean })?.isAdmin === true;

  useEffect(() => {
    async function fetchOrCreateEvent() {
      const { data, error } = await supabase
        .from("scavenger_events")
        .select("id, status")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("⚠️ No event found. Creating a new one...");
          const { data: newEvent, error: insertError } = await supabase
            .from("scavenger_events")
            .insert([{ status: "not-live" }])
            .select("id, status")
            .single();

          if (insertError) {
            console.error("❌ Error creating scavenger event:", insertError);
            return;
          }

          setEventId(newEvent.id);
          setIsLive(newEvent.status === "live");
        } else {
          console.error("❌ Error fetching scavenger hunt status:", error);
        }
      } else {
        setEventId(data?.id || null);
        setIsLive(data?.status === "live");
      }
      setLoading(false);
    }

    fetchOrCreateEvent();
  }, []);

  async function toggleEventStatus() {
    if (!isAdmin || !eventId) return;

    const newStatus = isLive ? "not-live" : "live";

    const { error } = await supabase
      .from("scavenger_events")
      .update({ status: newStatus })
      .eq("id", eventId);

    if (error) {
      console.error("❌ Error updating event status:", error);
    } else {
      setIsLive(newStatus === "live");
    }
  }

  if (loading) return <p className="text-center text-gray-500">Loading event status...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-center mb-4 mt-5">🏆 Scavenger Hunt</h1>

      {/* ✅ Judges Only: Toggle Button */}
      {isAdmin && (
        <div className="text-center mb-4">
          <button
            onClick={toggleEventStatus}
            className={`px-4 py-2 font-bold rounded-lg ${
              isLive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            } text-white`}
            disabled={!eventId}
          >
            {isLive ? "❌ Stop Event" : "✅ Start Event"}
          </button>
        </div>
      )}

      <ScavengerTasks />
      <ScavengerTeams />
    </div>
  );
}
