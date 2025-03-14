import { NextApiRequest, NextApiResponse } from "next";
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await clerk.users.getUser(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl || null, // ✅ Include image URL
      email: user.emailAddresses?.[0]?.emailAddress || null, // ✅ Include primary email
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    });
  } catch (error) {
    console.error("❌ Error fetching user from Clerk:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
