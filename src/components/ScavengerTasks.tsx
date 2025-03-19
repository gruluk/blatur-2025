import { useState, useEffect } from "react";
import { supabase } from "../../supabase";

interface ScavengerTask {
  id: string;
  title: string;
  points: number;
}

export default function ScavengerTasks() {
  const [tasks, setTasks] = useState<ScavengerTask[]>([]);
  const [newTask, setNewTask] = useState({ title: "", points: 1 });
  const [editingTask, setEditingTask] = useState<ScavengerTask | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase.from("scavenger_tasks").select("*");
      if (error) console.error("🚨 Error fetching tasks:", error);
      if (data) setTasks(data);
    }
    fetchTasks();
  }, []);

  async function addTask() {
    if (!newTask.title.trim()) return alert("Task title cannot be empty!");
    const { data, error } = await supabase.from("scavenger_tasks").insert([newTask]).select("*");
    if (error) return console.error("🚨 Error adding task:", error);
    if (data) setTasks([...tasks, data[0]]);
    setNewTask({ title: "", points: 1 });
  }

  async function updateTask() {
    if (!editingTask) return;
    const { error } = await supabase.from("scavenger_tasks").update({
      title: editingTask.title,
      points: editingTask.points
    }).eq("id", editingTask.id);

    if (error) return console.error("🚨 Error updating task:", error);

    setTasks(tasks.map((task) => (task.id === editingTask.id ? editingTask : task)));
    setEditingTask(null);
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from("scavenger_tasks").delete().eq("id", id);
    if (error) return console.error("🚨 Error deleting task:", error);
    setTasks(tasks.filter((task) => task.id !== id));
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-lg max-w-3xl mx-auto">
      {/* Header */}
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        📜 Scavenger Tasks
      </h3>

      {/* Task Form */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Title Input */}
        <input
          type="text"
          className="flex-1 border border-gray-300 p-2 rounded-md shadow-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Task Title"
          value={editingTask ? editingTask.title : newTask.title}
          onChange={(e) =>
            editingTask
              ? setEditingTask({ ...editingTask, title: e.target.value })
              : setNewTask({ ...newTask, title: e.target.value })
          }
        />

        {/* Points Input */}
        <input
          type="number"
          className="w-24 text-black border border-gray-300 p-2 rounded-md shadow-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
          min="1"
          value={editingTask ? editingTask.points : newTask.points}
          onChange={(e) =>
            editingTask
              ? setEditingTask({ ...editingTask, points: Number(e.target.value) })
              : setNewTask({ ...newTask, points: Number(e.target.value) })
          }
        />

        {/* Add/Update Button */}
        <button
          className={`px-4 py-2 font-bold text-white rounded-md shadow-md transition ${
            editingTask
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
          onClick={editingTask ? updateTask : addTask}
        >
          {editingTask ? "✏️ Update" : "➕ Add"}
        </button>
      </div>

      {/* Task List */}
      <ul className="mt-6 space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="p-3 bg-white shadow-md rounded-md border border-gray-300 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 w-full">
              <p className="text-lg font-semibold text-gray-800">{task.title}</p>
              <p className="text-sm text-gray-500">⭐ {task.points} points</p>
            </div>

            {/* Buttons (Stacked on mobile, horizontal on desktop) */}
            <div className="flex sm:flex-row flex-col w-full sm:w-auto gap-2">
              <button
                className="w-full sm:w-auto px-4 py-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition shadow-md"
                onClick={() => setEditingTask(task)}
              >
                ✏️ Edit
              </button>
              <button
                className="w-full sm:w-auto px-4 py-2 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition shadow-md"
                onClick={() => deleteTask(task.id)}
              >
                ❌ Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
