export interface ScavengerTeam {
  id: string;
  name: string;
  members: string[];
}

export interface ScavengerTask {
  id: string;
  title: string;
  points: number;
}

export interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export interface ScavengerSubmission {
  id: string;
  task_id: string;
  team_id: string;
  media_url: string;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  judge_id?: string;
}
