import { NextApiRequest, NextApiResponse } from "next";
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("📥 Received request at /api/getUserAvatars");

  if (req.method !== "POST") {
    console.log("❌ Invalid request method:", req.method);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    console.log("❌ Invalid user IDs format");
    return res.status(400).json({ error: "Invalid user IDs" });
  }

  try {
    const userProfiles: Record<string, string> = {};

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await clerk.users.getUser(userId);
          userProfiles[userId] = user.imageUrl;
        } catch (error) {
          console.error(`❌ Error fetching avatar for ${userId}:`, error);
          userProfiles[userId] = "/bedkom-logo.png"; // Fallback avatar
        }
      })
    );

    return res.status(200).json(userProfiles);
  } catch (error) {
    console.error("❌ Error fetching user avatars:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
