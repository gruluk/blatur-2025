interface TeamType {
  id: string;
  name: string;
  user_ids: string[]; // Array of user IDs
}

interface UserType {
  firstName: string;
  lastName: string;
}

interface TaskType {
  id: string;
  task: string;
}

interface TeamTaskType {
  task_id: string;
  completed: boolean;
  reviewed: boolean;
  approved: boolean | null; // `null` for pending, `true` for approved, `false` for rejected
}
