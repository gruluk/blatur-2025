import { supabase } from "../../supabase";

export const fetchUserAvatars = async (userIds: string[]) => {
  try {
    const response = await fetch("/api/getUserAvatars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user avatars");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching avatars:", error);
    return {};
  }
};

/** 🔥 Fetch all upcoming events */
export async function fetchEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("end_date", new Date().toISOString()) // ✅ Only show ongoing/upcoming events
    .order("start_date", { ascending: true });

  if (error) {
    console.error("❌ Error fetching events:", error);
    return [];
  }

  return data;
}

/** 🔥 Fetch a single event by ID */
export async function fetchEventById(eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error) {
    console.error(`❌ Error fetching event ${eventId}:`, error);
    return null;
  }

  return data;
}

/** 🔥 Register user for an event (Prevents duplicates) */
export async function registerForEvent(eventId: string, userId: string) {
  // ✅ Check if user is already registered
  const { data: existingRegistration } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (existingRegistration) {
    console.warn(`⚠️ User ${userId} is already registered for event ${eventId}.`);
    return true;
  }

  const { error } = await supabase
    .from("event_participants")
    .insert([{ event_id: eventId, user_id: userId }]);

  if (error) {
    console.error(`❌ Error registering user ${userId} for event ${eventId}:`, error);
    return false;
  }

  return true;
}

/** 🔥 Check if user is registered for an event */
export async function isUserRegisteredForEvent(eventId: string, userId: string) {
  const { data } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  return !!data; // ✅ Return `true` if registered, `false` otherwise
}

/** 🔥 Get user event status (Registered, Completed, etc.) */
export async function fetchUserEventStatus(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from("event_participants")
    .select("status") // Assuming `status` column exists (e.g., 'registered', 'completed')
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error(`❌ Error fetching event status for ${userId} in event ${eventId}:`, error);
    return null;
  }

  return data?.status || "not-registered"; // ✅ Default to "not-registered" if no data
}