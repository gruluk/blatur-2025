import { NextApiRequest, NextApiResponse } from "next";
import { createClerkClient } from "@clerk/backend";
import type { User } from "@clerk/backend"; // Import Clerk's User type

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let allUsers: User[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await clerk.users.getUserList({ limit, offset });

      allUsers = [...allUsers, ...response.data];

      if (response.data.length < limit) break; // Stop when there's no more data

      offset += limit;
    }

    console.log("✅ API fetched users:", allUsers.length);

    const users = allUsers.map((user) => ({
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
