import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function TabsNavigation() {
  return (
    <TabsList className="flex justify-center items-center w-full bg-transparent p-2 rounded-lg mb-5">
      <div className="flex w-full max-w-md justify-between">
        <TabsTrigger
          value="feed"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-md font-bold ring-offset-background transition-all text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
          )}
        >
          Feed
        </TabsTrigger>
        <TabsTrigger
          value="announcements"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-md font-bold ring-offset-background transition-all text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
          )}
        >
          Announcements
        </TabsTrigger>
        <TabsTrigger
          value="leaderboard"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-md font-bold ring-offset-background transition-all text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#F9B759] data-[state=active]:text-[#0D5474] data-[state=active]:shadow"
          )}
        >
          Leaderboard
        </TabsTrigger>
      </div>
    </TabsList>
  );
}
