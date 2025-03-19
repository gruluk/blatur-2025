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
import { TeamScore } from "@/components/TeamScore";
import Header from "@/components/Header";

export default function TeamPage() {
  const { user } = useUser();
  const [teams, setTeams] = useState<ScavengerTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ScavengerTeam | null>(null);
  const [tasks, setTasks] = useState<ScavengerTask[]>([]);
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);
  const [clerkUsers, setClerkUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<{ [submissionId: string]: string }>({});
  const [adjustedPoints, setAdjustedPoints] = useState<{ [submissionId: string]: number }>({});


  const isAdmin = (user?.publicMetadata as { isAdmin?: boolean })?.isAdmin === true;

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

  async function fetchTasks() {
    if (!selectedTeam) return;
    
    const { data, error } = await supabase
      .from("scavenger_tasks")
      .select("id, title, description, points");

    if (error) {
      console.error("🚨 Error fetching tasks:", error);
      return;
    }

    console.log("✅ Tasks fetched:", data);
    setTasks(data || []);
  }

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

    fetchTasks();
    fetchSubmissions();
  }, [selectedTeam]);

  async function handleJudgeAction(
    submissionId: string, 
    status: "approved" | "rejected", 
    comment: string, 
    points: number | null
  ) {
    // ✅ Get submission details
    const { data: submission, error: fetchError } = await supabase
      .from("scavenger_submissions")
      .select("task_id, team_id, media_url, points_awarded")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.error("Error fetching submission:", fetchError);
      return;
    }

    // ✅ Get the task details (title and points)
    const { data: task } = await supabase
      .from("scavenger_tasks")
      .select("title, points")
      .eq("id", submission.task_id)
      .single();

    const taskTitle = task?.title || "Unknown Task";
    const defaultPoints = task?.points || 0;
    const finalPoints = status === "approved" ? points ?? defaultPoints : 0; // ✅ Use judge-adjusted points or default

    // ✅ Update submission status and points awarded
    const { error: updateError } = await supabase
      .from("scavenger_submissions")
      .update({ status, judge_comment: comment, points_awarded: finalPoints })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Error updating submission:", updateError);
      return;
    }

    // ✅ Generate a system message
    const systemMessage =
      status === "approved"
        ? `✅ Task"${taskTitle}" has been approved with ${finalPoints} points! 🎉`
        : `❌ Task "${taskTitle}" has been rejected. ${comment ? `Reason: ${comment}` : ""}`;

    // ✅ Insert system post in scavenger_feed
    const { error: feedError } = await supabase.from("scavenger_feed").insert([
      {
        team_id: submission.team_id,
        user_id: null, // System message, no user
        username: "Dommer",
        content: systemMessage,
        media_urls: submission.media_url ? [submission.media_url] : [],
        type: "system",
        created_at: new Date().toISOString(),
      },
    ]);

    if (feedError) {
      console.error("Error posting system message:", feedError);
    }

    // ✅ Update UI state
    setSubmissions((prevSubmissions) =>
      prevSubmissions.map((sub) =>
        sub.id === submissionId ? { ...sub, status, judge_comment: comment, points_awarded: finalPoints } : sub
      )
    );
  }

  if (!user?.id) return <p>Loading user...</p>;
  if (loading) return <p>Loading team data...</p>;
  if (!selectedTeam) return <p>No team found. Ask a judge</p>;

  return (
    <div className="p-6 mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
      <Header />
      <h1 className="text-2xl text-white font-bold mt-15">🏆 Rebus - Lag side</h1>

      {isAdmin && teams.length > 1 && (
        <TeamSelector teams={teams} selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam} />
      )}

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
          <TeamScore teamId={selectedTeam.id} />
          <TaskSubmissionForm 
            tasks={tasks} 
            selectedTeam={selectedTeam} 
            refreshSubmissions={fetchSubmissions} 
            refreshTasks={fetchTasks}
          />
          <TaskList tasks={tasks} teamId={selectedTeam.id} />

          {/* 🔥 Judges See Pending Submissions */}
          {isAdmin && (
            <div className="mt-6 w-full max-w-2xl">
              <h3 className="text-2xl font-semibold text-white mb-4">📷 Pending Submissions</h3>

              {submissions.length === 0 ? (
                <p className="text-gray-300 text-center">Ingen innleveringer ennå.</p>
              ) : (
                <div className="space-y-6">
                  {submissions.map((submission) => {
                    const task = tasks.find((t) => t.id === submission.task_id);
                    let mediaUrl = submission.media_url;
                    if (!mediaUrl.startsWith("http")) {
                      mediaUrl = supabase.storage.from("scavenger-feed").getPublicUrl(mediaUrl).data.publicUrl;
                    }

                    // ✅ Define status styles
                    const STATUS_MAP = {
                      pending: { text: "Venter på dommer", color: "bg-yellow-500", icon: "⏳" },
                      approved: { text: "Godkjent", color: "bg-green-500", icon: "✅" },
                      rejected: { text: "Avvist", color: "bg-red-500", icon: "🚫" },
                    };
                    const { text: statusText, color: statusColor, icon: statusIcon } =
                      STATUS_MAP[submission.status as keyof typeof STATUS_MAP];

                    return (
                      <div key={submission.id} className="bg-white shadow-md rounded-lg p-5 border border-gray-200">
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1 text-white text-sm font-semibold rounded-full ${statusColor}`}>
                          <span>{statusIcon}</span>
                          <span>{statusText}</span>
                        </div>

                        {/* Task Title */}
                        <h4 className="mt-3 text-lg font-semibold text-gray-900">{task?.title || "Unknown Task"}</h4>
                        <p className="text-sm text-gray-600">{task?.description}</p>

                        {/* Media Preview */}
                        {mediaUrl && (
                          <div className="mt-4 flex justify-center">
                            {mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                              <img
                                src={mediaUrl}
                                alt="Submission"
                                className="rounded-lg border border-gray-300 shadow-sm max-w-full max-h-80"
                              />
                            ) : mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video controls className="rounded-lg border border-gray-300 shadow-sm max-w-full max-h-80">
                                <source src={mediaUrl} type="video/mp4" />
                                Din nettleser støtter ikke videoavspilling.
                              </video>
                            ) : (
                              <p className="text-gray-500">⚠️ Ugyldig filtype</p>
                            )}
                          </div>
                        )}

                        {/* ✅ Judge Actions (ONLY for Pending Submissions) */}
                        {submission.status === "pending" && (
                          <>
                            {/* Comment Input */}
                            <textarea
                              className="w-full mt-4 p-3 border border-gray-300 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                              placeholder="Skriv en kommentar (valgfritt)"
                              value={comments[submission.id] || ""}
                              onChange={(e) => setComments((prev) => ({ ...prev, [submission.id]: e.target.value }))}
                            />

                            {/* Points & Actions */}
                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                              {/* Points Adjustment */}
                              <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-600">Poeng:</label>
                                <input
                                  type="number"
                                  min="0"
                                  defaultValue={task?.points || 0}
                                  className="w-16 p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                                  onChange={(e) =>
                                    setAdjustedPoints((prev) => ({
                                      ...prev,
                                      [submission.id]: Number(e.target.value) || 0,
                                    }))
                                  }
                                />
                              </div>

                              {/* Approve / Reject Buttons */}
                              <div className="flex space-x-2">
                                <button
                                  className="px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition"
                                  onClick={() =>
                                    handleJudgeAction(
                                      submission.id,
                                      "approved",
                                      comments[submission.id] || "",
                                      adjustedPoints[submission.id] ?? (task?.points || 0)
                                    )
                                  }
                                >
                                  ✅ Godkjenn
                                </button>
                                <button
                                  className="px-4 py-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition"
                                  onClick={() => handleJudgeAction(submission.id, "rejected", comments[submission.id] || "", 0)}
                                >
                                  ❌ Avvis
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
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
            <h2 className="mt-2 text-xl text-onlineBlue font-bold">{selectedTeam.name}</h2>
            <TeamMembers members={selectedTeam.members} clerkUsers={clerkUsers} />

            <h3 className="mt-4 text-lg font-semibold">📍 Hvordan det fungerer</h3>
            <p className="text-gray-700 mt-1">
              Laget vil motta instruksjoner om et spesifikt sted dere må besøke. For å bekrefte at dere har ankommet riktig sted, må dere sende inn bilde- eller videobevis i <strong>Feed</strong>.
              Når en dommer godkjenner innsendingen, vil dere få instruksjoner til neste sted.
            </p>

            <h3 className="mt-4 text-lg font-semibold">🎯 Slik får dere poeng</h3>
            <ul className="text-gray-700 list-disc list-inside mt-1">
              <li>Det å besøke steder gir ingen poeng. Dere må gjennom alle stedene for å fullføre rebusen</li>
              <li>Underveis må dere gjøre oppgaver som gir poeng.</li>
              <li>For å få poeng må dere sende inn bilde- eller videobevis i <strong>Tasks</strong>.</li>
              <li>En dommer vurderer om oppgaven er godkjent eller ikke.</li>
              <li>Oppgaver har mulighet for <strong>bonuspoeng</strong> basert på kreativitet eller ekstra innsats!</li>
            </ul>

            <h3 className="mt-4 text-lg font-semibold">⚖️ Dommergodkjenning</h3>
            <p className="text-gray-700 mt-1">
              Dommerne har siste ord når det gjelder godkjenning av oppgaver og tildeling av poeng. Gjør en innsats, vær kreative og imponer dommerne for å få ekstra poeng!
            </p>

            <p className="text-gray-700 mt-4 font-semibold">🔹 Klar? Start reisen og samle poeng! 🔹</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
