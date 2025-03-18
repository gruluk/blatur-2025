import { ScavengerTask } from "@/types"; // ✅ Import the correct type

export function TaskList({ tasks }: { tasks: ScavengerTask[] }) {
  return (
    <div>
      <h3 className="mt-4 text-lg font-semibold">📜 Tasks</h3>
      <ul className="list-disc ml-5">
        {tasks.length === 0 ? (
          <p>No tasks assigned yet.</p>
        ) : (
          tasks.map((task) => (
            <li key={task.id}>
              {task.title} - {task.points} pts
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
