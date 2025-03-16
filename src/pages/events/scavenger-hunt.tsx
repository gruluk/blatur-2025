import { GetServerSideProps } from "next";
import { useState } from "react";
import { supabase } from "../../../supabase";
import { useSession } from "@clerk/nextjs";
import Header from "@/components/Header";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Get the scavenger hunt event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("type", "scavenger-hunt")
    .single();

  // 🔥 If event is missing or hidden, redirect user
  if (eventError || !event || event.status === "hidden") {
    return {
      redirect: {
        destination: "/",
        permanent: false, // 🚀 Prevents caching
      },
    };
  }

  // Fetch all scavenger hunt tasks
  const { data: tasks } = await supabase
    .from("event_scavenger_hunt")
    .select("*")
    .eq("event_id", event.id);

  return { props: { event, tasks: tasks || [] } };
};

export default function ScavengerHuntPage({ event, tasks }) {
  const { session } = useSession();
  const [taskList, setTaskList] = useState(tasks);

  if (!event) return <div>No active scavenger hunt at the moment.</div>;

  const markAsCompleted = async (taskId) => {
    const res = await fetch("/api/mark-task-completed", {
      method: "POST",
      body: JSON.stringify({ taskId }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      setTaskList((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: true } : task
        )
      );
    }
  };

  return (
    <div>
      <Header />
      <div className="mt-15">
        <h1>{event.name}</h1>
        <p>{event.description}</p>

        <h2>Tasks</h2>
        <ul>
            {taskList.map((task) => (
            <li key={task.id}>
                <span>{task.task}</span>
                {task.completed ? (
                <span>✅ Completed</span>
                ) : (
                <button onClick={() => markAsCompleted(task.id)}>Mark as Completed</button>
                )}
            </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
