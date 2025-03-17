import { useState } from "react";
import { supabase } from "../../../supabase";

export default function ManageTasks({ tasks, setTasks, eventId }) {
  const [newTask, setNewTask] = useState("");
  const [taskPoints, setTaskPoints] = useState<number>(0); // ✅ State for points

  async function createTask() {
    if (!newTask.trim()) return alert("Task cannot be empty!");
    if (taskPoints < 0) return alert("Points cannot be negative!");

    const { data, error } = await supabase
      .from("scavenger_hunt_tasks")
      .insert([{ event_id: eventId, task: newTask, points: taskPoints }]) // ✅ Store points
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return;
    }

    setTasks([...tasks, data]);
    setNewTask("");
    setTaskPoints(0); // ✅ Reset points input
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h2 className="text-lg font-semibold">Create a Task</h2>
      <div className="flex space-x-2 mt-2">
        <input
          type="text"
          placeholder="Enter task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-md"
        />
        <input
          type="number"
          placeholder="Points"
          value={taskPoints}
          onChange={(e) => setTaskPoints(Number(e.target.value))}
          className="w-20 p-2 border border-gray-300 rounded-md"
        />
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          onClick={createTask}
        >
          Add Task
        </button>
      </div>
    </div>
  );
}
