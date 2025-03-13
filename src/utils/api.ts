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
