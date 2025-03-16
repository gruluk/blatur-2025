export default function TaskList({ tasks, teamTasks, teams, markTaskCompleted, reviewTask }) {
  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h2 className="text-lg font-semibold">Tasks</h2>
      {tasks.length === 0 ? (
        <p className="text-gray-500">No tasks created yet.</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="border p-2 rounded-md mt-2 bg-white">
            <h3 className="text-md font-semibold">{task.task}</h3>
            {teams.map((team) => {
              const teamTask = teamTasks.find((t) => t.task_id === task.id && t.team_id === team.id);
              return (
                <div key={team.id} className="flex justify-between mt-1">
                  <span>{team.name}</span>
                  {teamTask?.reviewed ? (
                    <span className="px-2 py-1 bg-green-500 text-white rounded-md">Reviewed ✅</span>
                  ) : teamTask?.completed ? (
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={() => reviewTask(team.id, task.id)}
                    >
                      ✅ Approve
                    </button>
                  ) : (
                    <button
                      className="px-2 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                      onClick={() => markTaskCompleted(team.id, task.id)}
                    >
                      ✔️ Mark as Completed
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
