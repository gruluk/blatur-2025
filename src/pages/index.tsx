import { useUser } from "@clerk/nextjs";
import Header from "@/components/Header";
import TabsNavigation from "@/components/TabsNavigation";
import Feed from "@/components/Feed";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import Leaderboard from "./leaderboard";
import Announcements from "@/components/Announcements";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-onlineBlue text-white p-6">
      <Header />
      <Tabs defaultValue="feed" className="w-full mt-15">
        {/* 🔥 Submit Button */}
        {isSignedIn && (
          <div className="flex justify-center">
            <h1 className="text-lg md:text-2xl font-bold text-onlineOrange truncate max-w-[700] md:max-w-none mb-5">
              Mentalt og fysisk overlegne
            </h1>
          </div>
        )}

        <TabsNavigation />

        {/* ✅ Add Leaderboard TabsContent */}
        <TabsContent value="feed">
          <Feed />
        </TabsContent>

        <TabsContent value="announcements">
          <Announcements />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
