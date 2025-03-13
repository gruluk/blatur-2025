import { createClerkClient } from "@clerk/backend"; // ✅ Correct import
import type { NextApiRequest, NextApiResponse } from "next";

// ✅ Correct way to initialize Clerk with an empty object OR use `secretKey`
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || "" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId } = req.query;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Invalid or missing userId" });
  }

  try {
    const user = await clerk.users.getUser(userId); // ✅ Correct usage
    res.status(200).json({ name: user.fullName || user.emailAddresses[0]?.emailAddress || "Unknown User" });
  } catch (error) {
    console.error("❌ Clerk API Error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
}
