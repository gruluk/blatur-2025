import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { TabsContent } from "@/components/ui/tabs";
import { formatRelativeTime } from "@/utils/time";
import FullscreenMediaViewer from "@/components/FullscreenMediaViewer";
import Image from "next/image";
import ScavengerPostForm from "./ScavengerPostForm";

type FeedItem = {
  id: string;
  user_id: string | null;
  username: string | null;
  content: string | null;
  media_urls: string[] | null;
  type: "post" | "system"; // 'post' = user post, 'system' = system-generated update
  created_at: string;
};

export default function ScavengerFeed({ teamId }: { teamId: string }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchFeed() {
    setLoading(true);

    const { data, error } = await supabase
      .from("scavenger_feed")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) console.error("❌ Error fetching scavenger feed:", error);
    else setFeed(data || []);

    setLoading(false);
  }

  useEffect(() => {
    fetchFeed();
  }, [teamId]);

  return (
    <TabsContent value="feed">
      <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
        <ScavengerPostForm teamId={teamId} onPostCreated={() => fetchFeed()} />

        {feed.map((item) => (
          <div key={item.id} className={`feed-post p-4 rounded-lg shadow-md w-full max-w-[600px] bg-white text-onlineBlue`}>
            <div className="flex items-center space-x-3">
              <p className="font-bold">{item.username || "System"}</p>
              <p className="text-sm text-gray-500">{formatRelativeTime(item.created_at)}</p>
            </div>

            {/* 📝 Post Content */}
            {item.content && <p className="mt-2 whitespace-pre-wrap">{item.content}</p>}

            {/* 📸 Images */}
            {item.media_urls && item.media_urls.length > 0 && (
              <div className="mt-2 flex flex-col items-center space-y-2">
                {item.media_urls.map((url, index) => {
                  const publicUrl = url.startsWith("http") 
                    ? url 
                    : supabase.storage.from("scavenger-feed").getPublicUrl(url).data.publicUrl;

                  return (
                    <Image
                      key={index}
                      src={publicUrl}
                      alt="Post Image"
                      width={600}
                      height={400}
                      className="rounded-lg cursor-pointer"
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {loading && <p className="text-gray-500 text-sm">Loading feed...</p>}
      </div>

      <FullscreenMediaViewer media={fullscreenMedia} onClose={() => setFullscreenMedia(null)} />
    </TabsContent>
  );
}
