import { NextApiRequest, NextApiResponse } from "next";
import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const allUsers = await clerk.users.getUserList();
    console.log("✅ API fetched users:", allUsers.data);

    const users = allUsers.data.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error("❌ API Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}
