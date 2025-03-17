import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function TeamTaskList({ tasks, teamTasks, userTeamId }) {
  const [activeTab, setActiveTab] = useState("all");

  // 🔥 Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    const taskStatus = teamTasks.find((t) => t.task_id === task.id);

    if (activeTab === "not-done") {
      return !taskStatus?.proof_url || !taskStatus?.reviewed || taskStatus?.approved === false; // Includes rejected & pending
    }
    if (activeTab === "done") {
      return taskStatus?.reviewed && taskStatus?.approved;
    }
    return true; // Show all tasks
  });

  return (
    <div className="w-full">
      {/* 🔥 Tabs for Filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex justify-center items-center w-full bg-transparent p-2 rounded-lg mb-5">
          <div className="flex w-full max-w-md justify-between">
            {[
              { label: "All", value: "all" },
              { label: "Not Done", value: "not-done" },
              { label: "Done", value: "done" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-md font-bold ring-offset-background transition-all text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </div>
        </TabsList>
      </Tabs>

      {/* 🔥 Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <p className="text-gray-500 text-center">No tasks found.</p>
        ) : (
          filteredTasks.map((task) => {
            const taskStatus = teamTasks.find((t) => t.task_id === task.id);

            // 🔥 Determine Task Status
            let statusText = "❌ Not Done";
            let statusColor = "text-gray-600";

            if (taskStatus?.reviewed) {
              if (taskStatus?.approved) {
                statusText = "✅ Done";
                statusColor = "text-green-600";
              } else {
                statusText = "🚫 Rejected";
                statusColor = "text-red-600";
              }
            } else if (taskStatus?.proof_url) {
              statusText = "⏳ Pending Review";
              statusColor = "text-yellow-600";
            }

            return (
              <Link key={task.id} href={`/events/scavenger-hunt/task/${task.id}`} passHref>
                <div className="p-4 bg-white shadow-md rounded-lg border-l-4 mt-3 border-gray-300 cursor-pointer hover:bg-gray-100 transition">
                  <h3 className="text-lg font-semibold">{task.task}</h3>

                  {/* 🔥 Task Status Indicator */}
                  <p className={`text-sm mt-2 font-bold ${statusColor}`}>{statusText}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
