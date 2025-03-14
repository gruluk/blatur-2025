import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../supabase";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Submission = {
  id: string;
  user_id: string;
  achievement_id: string;
  created_at: string;
  status: string;
  achievements: {
    title: string;
    points: number;
  };
  users: {
    name: string;
  };
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  points: number;
};

export default function JudgePanel() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [judgedSubmissions, setJudgedSubmissions] = useState<Submission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAchievement, setNewAchievement] = useState<Partial<Achievement>>({ title: "", description: "", points: 0 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // ✅ Fetch pending submissions
      const { data: pendingData, error: pendingError } = await supabase
        .from("submissions")
        .select("*")
        .eq("status", "pending");

      // ✅ Fetch judged submissions
      const { data: judgedData, error: judgedError } = await supabase
        .from("submissions")
        .select("*")
        .neq("status", "pending");

      if (pendingError) console.error("❌ Error fetching pending submissions:", pendingError);
      if (judgedError) console.error("❌ Error fetching judged submissions:", judgedError);

      // ✅ Ensure default empty arrays to avoid `null` errors
      const pendingSubmissions = pendingData || [];
      const judgedSubmissions = judgedData || [];

      // ✅ Get unique user IDs
      const allUserIds = [...new Set([...pendingSubmissions.map((s) => s.user_id), ...judgedSubmissions.map((s) => s.user_id)])];
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name")
        .in("id", allUserIds);

      if (usersError) console.error("❌ Error fetching users:", usersError);

      // ✅ Get unique achievement IDs
      const allAchievementIds = [...new Set([...pendingSubmissions.map((s) => s.achievement_id), ...judgedSubmissions.map((s) => s.achievement_id)])];
      const { data: achievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("id, title, points")
        .in("id", allAchievementIds);

      if (achievementsError) console.error("❌ Error fetching achievements:", achievementsError);

      const usersMap: Record<string, string> = users?.reduce((acc, user) => ({ ...acc, [user.id]: user.name }), {}) || {};
      const achievementsMap: Record<string, { title: string; points: number }> =
        achievements?.reduce((acc, ach) => ({ ...acc, [ach.id]: { title: ach.title, points: ach.points } }), {}) || {};

      const formattedPendingSubmissions = pendingSubmissions.map((submission) => ({
        ...submission,
        users: { name: usersMap[submission.user_id] || "Unknown User" },
        achievements: achievementsMap[submission.achievement_id] || { title: "Unknown", points: 0 },
      }));

      const formattedJudgedSubmissions = judgedSubmissions.map((submission) => ({
        ...submission,
        users: { name: usersMap[submission.user_id] || "Unknown User" },
        achievements: achievementsMap[submission.achievement_id] || { title: "Unknown", points: 0 },
      }));

      setSubmissions(formattedPendingSubmissions);
      setJudgedSubmissions(
        formattedJudgedSubmissions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );
      setLoading(false);
    }

    fetchData();
  }, []);

  async function handleCreateAchievement() {
    if (!newAchievement.title || !newAchievement.description || !newAchievement.points) return;

    const { data, error } = await supabase.from("achievements").insert([newAchievement]).select("*");

    if (error) {
      console.error("❌ Error adding achievement:", error);
      return;
    }

    setAchievements([...achievements, ...data]);
    setNewAchievement({ title: "", description: "", points: 0 });
  }

  return (
    <div className="min-h-screen text-white p-6 mt-15">
      <Header />
      <h1 className="text-3xl font-bold text-center mb-6">⚖️ Dommerhjørnet</h1>

      <Tabs defaultValue="judgements" className="w-full max-w-2xl mx-auto">
        <TabsList className="flex justify-center items-center w-full bg-transparent p-2 rounded-lg mb-5">
          <div className="flex w-full max-w-md justify-between">
            <TabsTrigger value="judgements" className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-md font-bold transition-all text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
            )}>
              🔍 Judgements
            </TabsTrigger>
            <TabsTrigger value="achievements" className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-md font-bold transition-all text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
            )}>
              🏆 Achievements
            </TabsTrigger>
          </div>
        </TabsList>

        {/* 🔥 Judgements Tab */}
        <TabsContent value="judgements">
          {loading ? (
            <div className="flex flex-col items-center space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full max-w-[600px] rounded-lg" />)}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-center">🕒 Venter på dommer</h2>
              {submissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/judge/${submission.id}`}
                  passHref
                  className="w-full max-w-2xl mx-auto"
                >
                  <div className="p-4 rounded-lg shadow-md cursor-pointer bg-white text-onlineBlue">
                    <h2 className="text-lg font-bold">{submission.achievements.title}</h2>
                    <p className="text-gray-600">🏆 {submission.achievements.points} Points</p>
                    <p className="text-xs text-gray-400">🕒 {new Date(submission.created_at).toLocaleString()}</p>
                  </div>
                </Link>
              ))}

              <h2 className="mt-10 text-2xl font-bold text-center">📜 Tidligere dommer</h2>
              {judgedSubmissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={`/judge/${submission.id}`}
                  passHref
                  className="w-full max-w-2xl mx-auto"
                >
                  <div className="p-4 rounded-lg shadow-md cursor-pointer w-full mx-auto bg-white text-onlineBlue">
                    <h2 className="text-lg font-bold">{submission.achievements.title}</h2>
                    <p className="text-gray-600">🏆 {submission.achievements.points} Points</p>
                    <p className="text-xs text-gray-400">🕒 {new Date(submission.created_at).toLocaleString()}</p>
                    <p className={`text-sm font-bold ${submission.status === "approved" ? "text-green-600" : "text-red-600"}`}>
                      {submission.status.toUpperCase()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 🔥 Manage Achievements Tab */}
        <TabsContent value="achievements">
          <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-center">🏆 Manage Achievements</h2>

            {achievements.map((achievement) => (
              <Link
                key={achievement.id}
                href={`/judge/achievements/${achievement.id}`}
                passHref
                className="w-full max-w-2xl mx-auto"
              >
                <div className="p-4 rounded-lg shadow-md cursor-pointer bg-white text-onlineBlue">
                  <h2 className="text-lg font-bold">{achievement.title}</h2>
                  <p className="text-gray-600">{achievement.description}</p>
                  <p className="text-gray-500">🏆 {achievement.points} Points</p>
                </div>
              </Link>
            ))}

            {/* 🔥 Create New Achievement Form */}
            <div className="w-full p-4 bg-white text-onlineBlue rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-2">➕ Add New Achievement</h3>
              <Input
                placeholder="Title"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement((prev) => ({ ...prev, title: e.target.value }))}
                className="mb-2"
              />
              <Input
                placeholder="Description"
                value={newAchievement.description}
                onChange={(e) => setNewAchievement((prev) => ({ ...prev, description: e.target.value }))}
                className="mb-2"
              />
              <Input
                type="number"
                placeholder="Points"
                value={newAchievement.points}
                onChange={(e) => setNewAchievement((prev) => ({ ...prev, points: Number(e.target.value) }))}
                className="mb-4"
              />
              <Button onClick={handleCreateAchievement} className="w-full bg-green-600 hover:bg-green-700">
                ✅ Create Achievement
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
