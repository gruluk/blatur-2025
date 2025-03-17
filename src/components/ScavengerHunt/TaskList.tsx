import { useState } from "react";
import { supabase } from "../../../supabase";

type Task = {
  id: string;
  task: string;
  points: number; // ✅ Add points to type
};

type TaskListProps = {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
};

export default function TaskList({ tasks, setTasks }: TaskListProps) {
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editedTaskName, setEditedTaskName] = useState("");
  const [editedTaskPoints, setEditedTaskPoints] = useState<number>(0); // ✅ Add state for editing points

  async function updateTask(taskId: string) {
    if (!editedTaskName.trim()) return alert("Task cannot be empty!");
    if (editedTaskPoints < 0) return alert("Points cannot be negative!");

    const { error } = await supabase
      .from("scavenger_hunt_tasks")
      .update({ task: editedTaskName, points: editedTaskPoints }) // ✅ Update points
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      return;
    }

    // ✅ Update local state after successful edit
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, task: editedTaskName, points: editedTaskPoints } : task
      )
    );

    setEditingTask(null);
    setEditedTaskName("");
    setEditedTaskPoints(0);
  }

  async function deleteTask(taskId: string) {
    const { error } = await supabase.from("scavenger_hunt_tasks").delete().eq("id", taskId);

    if (error) {
      console.error("Error deleting task:", error);
      return;
    }

    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  }

  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h2 className="text-lg font-semibold">Tasks</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks created yet.</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="border p-2 rounded-md mt-2 bg-white flex justify-between items-center">
            {editingTask === task.id ? (
              <div className="flex items-center space-x-2 w-full">
                <input
                  type="text"
                  value={editedTaskName}
                  onChange={(e) => setEditedTaskName(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md flex-1"
                />
                <input
                  type="number"
                  value={editedTaskPoints}
                  onChange={(e) => setEditedTaskPoints(Number(e.target.value))}
                  className="p-2 border border-gray-300 rounded-md w-20"
                />
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="text-md font-semibold">{task.task}</h3>
                <p className="text-sm text-gray-500">🏆 {task.points} Points</p>
              </div>
            )}

            <div className="flex space-x-2">
              {editingTask === task.id ? (
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                  onClick={() => updateTask(task.id)}
                >
                  💾 Save
                </button>
              ) : (
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => {
                    setEditingTask(task.id);
                    setEditedTaskName(task.task);
                    setEditedTaskPoints(task.points); // ✅ Pre-fill points input
                  }}
                >
                  ✏️ Edit
                </button>
              )}

              <button
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={() => deleteTask(task.id)}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
