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
