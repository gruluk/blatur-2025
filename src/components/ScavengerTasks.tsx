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
    if (!newTask.title) return alert("Task title cannot be empty!");
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
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">📜 Task List</h3>
      <div className="flex gap-2">
        {/* Title Input */}
        <input
          type="text"
          className="border p-2 rounded w-full"
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
          className="border p-2 rounded w-20"
          min="1"
          value={editingTask ? editingTask.points : newTask.points}
          onChange={(e) =>
            editingTask
              ? setEditingTask({ ...editingTask, points: Number(e.target.value) })
              : setNewTask({ ...newTask, points: Number(e.target.value) })
          }
        />

        {/* Add/Update Button */}
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={editingTask ? updateTask : addTask}>
          {editingTask ? "✏️ Update" : "➕ Add"}
        </button>
      </div>

      {/* Task List */}
      <ul className="mt-4">
        {tasks.map((task) => (
          <li key={task.id} className="flex justify-between p-2 bg-white text-onlineBlue rounded mt-2">
            <span>{task.title} - {task.points} pts</span>
            <div>
              <button className="bg-blue-500 px-3 py-1 rounded mr-2" onClick={() => setEditingTask(task)}>✏️</button>
              <button className="bg-red-500 px-3 py-1 rounded" onClick={() => deleteTask(task.id)}>❌</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
