import { supabase } from "../../../../supabase";
import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { eventId, task } = req.body;

  if (!eventId || !task) {
    return res.status(400).json({ error: "Missing event ID or task" });
  }

  // 🔥 Check if the user is authenticated
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // 🔥 Insert into Supabase
  const { data, error } = await supabase
    .from("event_scavenger_hunt")
    .insert([{ event_id: eventId, task, completed: false }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ success: true, newTask: data });
}
