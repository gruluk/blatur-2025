import { useState } from "react";
import { supabase } from "../../../supabase";

export default function ManageTasks({ tasks, setTasks, teams, eventId }) {
  const [newTask, setNewTask] = useState("");

  async function createTask() {
    if (!newTask.trim()) return alert("Task cannot be empty!");

    const { data, error } = await supabase
      .from("scavenger_hunt_tasks")
      .insert([{ event_id: eventId, task: newTask }])
      .select()
      .single();

    if (error) return console.error("Error creating task:", error);

    setTasks([...tasks, data]);

    // Add the task for each team
    const newTeamTasks = teams.map((team) => ({
      task_id: data.id,
      team_id: team.id,
      completed: false,
      reviewed: false,
    }));

    await supabase.from("scavenger_hunt_team_tasks").insert(newTeamTasks);
    setNewTask("");
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h2 className="text-lg font-semibold">Create a Task</h2>
      <input
        type="text"
        placeholder="Enter task..."
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md"
      />
      <button
        className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-md"
        onClick={createTask}
      >
        Add Task
      </button>
    </div>
  );
}
