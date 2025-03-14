import Header from "@/components/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useJudgeData } from "@/hooks/useJudgeData";
import Judgements from "@/components/Judgements";
import Achievements from "@/components/Achievements";
import BonusPoints from "@/components/BonusPoints";

export default function JudgePanel() {
  const { submissions, judgedSubmissions, achievements, loading, setAchievements, users } = useJudgeData();

  return (
    <div className="min-h-screen text-white p-6 mt-15">
      <Header />
      <h1 className="text-3xl font-bold text-center mb-10">⚖️ Dommerhjørnet</h1>

      <Tabs defaultValue="judgements" className="w-full max-w-2xl mx-auto">
        <TabsList className="flex justify-center items-center w-full bg-transparent p-2 rounded-lg mb-3">
          <div className="flex w-full max-w-md justify-center gap-2 flex-wrap">
            <TabsTrigger
              value="judgements"
              className={cn(
                "flex-1 text-center rounded-md px-3 py-2 text-sm md:text-md font-bold transition-all text-white " +
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
                "data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
              )}
            >
              🔍 Judgements
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className={cn(
                "flex-1 text-center rounded-md px-3 py-2 text-sm md:text-md font-bold transition-all text-white " +
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
                "data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
              )}
            >
              🏆 Achievements
            </TabsTrigger>
            <TabsTrigger
              value="bonus"
              className={cn(
                "flex-1 text-center rounded-md px-3 py-2 text-sm md:text-md font-bold transition-all text-white " +
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
                "data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
              )}
            >
              🎁 Bonus Points
            </TabsTrigger>
          </div>
        </TabsList>

        {/* 🔍 Judgements Tab */}
        <TabsContent value="judgements">
          <Judgements loading={loading} submissions={submissions} judgedSubmissions={judgedSubmissions} />
        </TabsContent>

        {/* 🏆 Achievements Tab */}
        <TabsContent value="achievements">
          <Achievements achievements={achievements} setAchievements={setAchievements} />
        </TabsContent>

        {/* 🎁 Bonus Points Tab */}
        <TabsContent value="bonus">
          <BonusPoints users={users} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
