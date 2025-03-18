import { ClerkUser } from "@/types";

export function TeamMembers({ members, clerkUsers }: { members: string[]; clerkUsers: ClerkUser[] }) {
  return (
    <div>
      <h3 className="mt-4 text-lg text-white font-semibold">👥 Team Members</h3>
      <ul className="list-disc ml-5 text-white">
        {members.map((memberId) => {
          const user = clerkUsers.find((u) => u.id === memberId);
          return (
            <li key={memberId}>
              {user ? `${user.firstName} ${user.lastName}` : "Unknown User"}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
