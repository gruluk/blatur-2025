import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { useUser } from "@clerk/nextjs";
import { TeamSelector } from "@/components/TeamSelector";
import { TeamMembers } from "@/components/TeamMembers";
import { TaskList } from "@/components/TaskList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClerkUser, ScavengerTask, ScavengerTeam, ScavengerSubmission } from "@/types";
import { ScavengerFeed } from "@/components/ScavengerFeed";
import { TaskSubmissionForm } from "@/components/TaskSubmissionForm";

export default function TeamPage() {
  const { user } = useUser();
  const [teams, setTeams] = useState<ScavengerTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ScavengerTeam | null>(null);
  const [tasks, setTasks] = useState<ScavengerTask[]>([]);
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);
  const [clerkUsers, setClerkUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<{ [submissionId: string]: string }>({});

  const isAdmin = (user?.publicMetadata as { isAdmin?: boolean })?.isAdmin === true;

  useEffect(() => {
    async function fetchTeams() {
      setLoading(true);
      const { data, error } = isAdmin
        ? await supabase.from("scavenger_teams").select("*")
        : await supabase.from("scavenger_teams").select("*").filter("members", "cs", JSON.stringify([user?.id]));

      if (error) console.error("Error fetching teams:", error);
      if (data?.length) {
        setTeams(data);
        setSelectedTeam(data[0]);
      } else {
        setSelectedTeam(null);
      }
      setLoading(false);
    }

    async function fetchUsers() {
      const res = await fetch("/api/users");
      if (res.ok) {
        const users = await res.json();
        setClerkUsers(users);
      }
    }

    if (user?.id) {
      fetchTeams();
      fetchUsers();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!selectedTeam) return;
    
    async function fetchTasks() {
      const { data, error } = await supabase.from("scavenger_tasks").select("*");
      if (error) console.error("Error fetching tasks:", error);
      setTasks(data || []);
    }

    async function fetchSubmissions() {
        if (!selectedTeam) return;

        const { data, error } = await supabase
            .from("scavenger_submissions")
            .select("*")
            .eq("team_id", selectedTeam.id);

        if (error) console.error("Error fetching submissions:", error);
        setSubmissions(data || []);
    }

    fetchTasks();
    fetchSubmissions();
  }, [selectedTeam]);

  async function handleJudgeAction(submissionId: string, status: "approved" | "rejected", comment: string) {
    const { error } = await supabase
        .from("scavenger_submissions")
        .update({ status, judge_comment: comment }) // ✅ No more judge_id
        .eq("id", submissionId);

    if (error) {
        console.error("Error updating submission:", error);
    } else {
        setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) =>
            sub.id === submissionId ? { ...sub, status, judge_comment: comment } : sub
        )
        );
    }
  }

  if (!user?.id) return <p>Loading user...</p>;
  if (loading) return <p>Loading team data...</p>;
  if (!selectedTeam) return <p>No team found. Ask a judge</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold">🏆 Scavenger Hunt - Team Page</h1>

      {isAdmin && teams.length > 1 && (
        <TeamSelector teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
      )}

      <h2 className="mt-4 text-xl font-bold">Team: {selectedTeam.name}</h2>
      <TeamMembers members={selectedTeam.members} clerkUsers={clerkUsers} />

      {/* ✅ Tabs System */}
      <Tabs defaultValue="tasks" className="w-full mt-6">
        <TabsList className="flex justify-center items-center w-full bg-transparent p-2 rounded-lg mb-3">
          <div className="flex w-full max-w-md justify-center gap-2 flex-wrap">
            <TabsTrigger value="tasks">📜 Tasks</TabsTrigger>
            <TabsTrigger value="feed">📰 Feed</TabsTrigger>
            <TabsTrigger value="info">ℹ️ Information</TabsTrigger>
          </div>
        </TabsList>

        {/* 📜 Tasks Tab */}
        <TabsContent value="tasks">
          <TaskList tasks={tasks} teamId={selectedTeam.id} />
          <TaskSubmissionForm tasks={tasks} selectedTeam={selectedTeam} />

          {/* 🔥 Judges See Pending Submissions */}
            {isAdmin && (
            <div className="mt-6">
                <h3 className="text-lg font-semibold">📷 Pending Submissions</h3>
                {submissions.length === 0 ? (
                <p>No submissions yet.</p>
                ) : (
                <ul className="space-y-2">
                    {submissions.map((submission) => (
                    <li key={submission.id} className="p-2 bg-gray-800 text-white rounded">
                        <div className="flex justify-between">
                        <a
                            href={submission.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 underline"
                        >
                            View Submission
                        </a>
                        <span
                            className={`px-2 py-1 rounded ${
                            submission.status === "pending"
                                ? "bg-yellow-500"
                                : submission.status === "approved"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                        >
                            {submission.status}
                        </span>
                        </div>

                        {/* ✅ Comment Input for Judges */}
                        <textarea
                        className="w-full p-2 mt-2 border rounded bg-gray-900 text-white"
                        placeholder="Leave a comment (optional)"
                        value={comments[submission.id] || ""}
                        onChange={(e) =>
                            setComments((prev) => ({ ...prev, [submission.id]: e.target.value }))
                        }
                        />

                        {/* ✅ Approve/Reject Buttons (Now Passes Comment) */}
                        {isAdmin && submission.status === "pending" && (
                        <div className="mt-2 flex space-x-2">
                            <button
                            className="bg-green-500 px-3 py-1 rounded"
                            onClick={() =>
                                handleJudgeAction(submission.id, "approved", comments[submission.id] || "")
                            }
                            >
                            ✅ Approve
                            </button>
                            <button
                            className="bg-red-500 px-3 py-1 rounded"
                            onClick={() =>
                                handleJudgeAction(submission.id, "rejected", comments[submission.id] || "")
                            }
                            >
                            ❌ Reject
                            </button>
                        </div>
                        )}
                    </li>
                    ))}
                </ul>
                )}
            </div>
            )}
        </TabsContent>

        {/* 📰 Feed Tab */}
        <TabsContent value="feed">
          <ScavengerFeed />
        </TabsContent>

        {/* ℹ️ Information Tab */}
        <TabsContent value="info">
          <div className="p-4 bg-gray-100 rounded-md shadow">
            <h3 className="text-lg font-semibold">ℹ️ Team Information</h3>
            <p className="text-gray-700 mt-2">🏆 Complete tasks to earn points. Judges must approve submissions.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
