import { useEffect, useState } from "react";
import { supabase } from "../../../supabase";
import { useUser } from "@clerk/nextjs";
import { TeamSelector } from "@/components/TeamSelector";
import { TeamMembers } from "@/components/TeamMembers";
import { TaskList } from "@/components/TaskList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClerkUser, ScavengerTask, ScavengerTeam, ScavengerSubmission } from "@/types";
import { TaskSubmissionForm } from "@/components/TaskSubmissionForm";
import ScavengerFeed from "@/components/ScavengerFeed";

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
      const { data, error } = await supabase.from("scavenger_tasks").select("id, title, description");

      if (error) console.error("Error fetching tasks:", error);
      else setTasks(data || []);
    }

    async function fetchSubmissions() {
      if (!selectedTeam) return;

      const { data, error } = await supabase
        .from("scavenger_submissions")
        .select("*, scavenger_tasks(title, description)") // ✅ Include task details
        .eq("team_id", selectedTeam.id)
        .order("submitted_at", { ascending: false });

      if (error) console.error("Error fetching submissions:", error);
      else setSubmissions(data || []);
    }

    fetchTasks();
    fetchSubmissions();
  }, [selectedTeam]);

  async function handleJudgeAction(submissionId: string, status: "approved" | "rejected", comment: string) {
    // ✅ Get submission details
    const { data: submission, error: fetchError } = await supabase
      .from("scavenger_submissions")
      .select("task_id, team_id, media_url")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("Error fetching submission:", fetchError);
      return;
    }

    // ✅ Get the task title
    const { data: task } = await supabase
      .from("scavenger_tasks")
      .select("title")
      .eq("id", submission.task_id)
      .single();

    const taskTitle = task?.title || "Unknown Task";

    // ✅ Update submission status
    const { error: updateError } = await supabase
      .from("scavenger_submissions")
      .update({ status, judge_comment: comment })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Error updating submission:", updateError);
      return;
    }

    // ✅ Generate a system message
    const systemMessage =
      status === "approved"
        ? `✅ Task **"${taskTitle}"** has been **approved**! 🎉`
        : `❌ Task **"${taskTitle}"** has been **rejected**. ${comment ? `Reason: ${comment}` : ""}`;

    // ✅ Insert system post in scavenger_feed
    const { error: feedError } = await supabase.from("scavenger_feed").insert([
      {
        team_id: submission.team_id,
        user_id: null, // System message, no user
        username: "System",
        content: systemMessage,
        media_urls: submission.media_url ? [submission.media_url] : [],
        type: "system", // ✅ Mark as system-generated
        created_at: new Date().toISOString(),
      },
    ]);

    if (feedError) {
      console.error("Error posting system message:", feedError);
    }

    // ✅ Update UI state
    setSubmissions((prevSubmissions) =>
      prevSubmissions.map((sub) =>
        sub.id === submissionId ? { ...sub, status, judge_comment: comment } : sub
      )
    );
  }

  if (!user?.id) return <p>Loading user...</p>;
  if (loading) return <p>Loading team data...</p>;
  if (!selectedTeam) return <p>No team found. Ask a judge</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl text-white font-bold">🏆 Scavenger Hunt - Team Page</h1>

      {isAdmin && teams.length > 1 && (
        <TeamSelector teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
      )}

      <h2 className="mt-4 text-xl text-white font-bold">Team: {selectedTeam.name}</h2>
      <TeamMembers members={selectedTeam.members} clerkUsers={clerkUsers} />

      {/* ✅ Tabs System */}
      <Tabs defaultValue="tasks" className="w-full mt-6">
        <TabsList className="flex justify-center text-white items-center w-full bg-transparent p-2 rounded-lg mb-3">
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
              <h3 className="text-lg text-white font-semibold">📷 Pending Submissions</h3>
              {submissions.length === 0 ? (
                <p>No submissions yet.</p>
              ) : (
                <ul className="space-y-4">
                  {submissions.map((submission) => {
                    const task = tasks.find((t) => t.id === submission.task_id); // ✅ Find task by ID

                    // ✅ Ensure the media URL is correctly formatted
                    let mediaUrl = submission.media_url;
                    if (!mediaUrl.startsWith("http")) {
                      mediaUrl = supabase.storage.from("scavenger-feed").getPublicUrl(mediaUrl).data.publicUrl;
                    }

                    return (
                      <li key={submission.id} className="p-4 bg-white rounded-lg text-black shadow-md">
                        <h4 className="text-md font-semibold">{task?.title || "Unknown Task"}</h4>
                        <p className="text-gray-600 text-sm">{task?.description}</p> {/* ✅ Show task description */}

                        {/* 🖼️ Display Image or 🎥 Video Inline */}
                        {mediaUrl ? (
                          <div className="mt-3 flex justify-center">
                            {mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                              <img
                                key={mediaUrl}
                                src={mediaUrl}
                                alt="Submission Media"
                                className="rounded-lg max-w-full max-h-60"
                                onError={(e) => console.error("🛑 Image Load Error:", e.currentTarget.src)}
                              />
                            ) : mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video key={mediaUrl} controls className="rounded-lg max-w-full max-h-60">
                                <source src={mediaUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <p className="text-gray-500">Unsupported media type</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">⚠️ Media not found</p>
                        )}

                        {/* ✅ Status Label */}
                        <span
                          className={`block text-center text-sm font-semibold mt-2 px-3 py-1 rounded 
                          ${submission.status === "pending" ? "bg-yellow-500" : submission.status === "approved" ? "bg-green-500" : "bg-red-500"}`}
                        >
                          {submission.status}
                        </span>

                        {/* ✅ Comment Input for Judges */}
                        <textarea
                          className="w-full p-2 mt-2 border rounded bg-gray-900 text-white"
                          placeholder="Leave a comment (optional)"
                          value={comments[submission.id] || ""}
                          onChange={(e) => setComments((prev) => ({ ...prev, [submission.id]: e.target.value }))}
                        />

                        {/* ✅ Approve/Reject Buttons */}
                        {isAdmin && submission.status === "pending" && (
                          <div className="mt-2 flex space-x-2">
                            <button
                              className="bg-green-500 px-3 py-1 rounded"
                              onClick={() => handleJudgeAction(submission.id, "approved", comments[submission.id] || "")}
                            >
                              ✅ Approve
                            </button>
                            <button
                              className="bg-red-500 px-3 py-1 rounded"
                              onClick={() => handleJudgeAction(submission.id, "rejected", comments[submission.id] || "")}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </TabsContent>

        {/* 📰 Feed Tab */}
        <TabsContent value="feed">
          {selectedTeam && <ScavengerFeed teamId={selectedTeam.id} />}
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
