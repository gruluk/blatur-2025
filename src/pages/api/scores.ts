import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../supabase"; // Adjust path if needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 🔥 Call the SQL function instead of using .group()
    const { data, error } = await supabase.rpc("get_leaderboard_scores");

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Error fetching scores:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
}
