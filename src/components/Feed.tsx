import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../supabase";
import PostForm from "./PostForm";
import { TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { formatRelativeTime } from "@/utils/time";
import FullscreenMediaViewer from "@/components/FullscreenMediaViewer";

type FeedItem = {
  is_announcement: boolean;
  id: string;
  user_id: string;
  username: string;
  content: string | null;
  image_urls: string[] | null;
  video_urls: string[] | null;
  created_at: string;
  comments: { count: number }[];
};

const fetchUserAvatars = async (userIds: string[]) => {
  try {
    const response = await fetch("/api/getUserAvatars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user avatars");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching avatars:", error);
    return {};
  }
};

export default function Feed() {
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);

  const formatPostContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.split(urlRegex).map((part, index) =>
      urlRegex.test(part) ? (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-words"
          style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
        >
          {part.length > 30 ? `${part.substring(0, 27)}...` : part}
        </a>
      ) : (
        part
      )
    );
  };

  async function fetchFeed() {
    const { data, error } = await supabase
      .from("posts")
      .select("*, comments(count)")
      .order("created_at", { ascending: false });

    if (error) console.error("❌ Error fetching feed:", error);
    else {
      setFeed(data);

      const userIds = data.map((post) => post.user_id);
      const avatars = await fetchUserAvatars(userIds);
      setUserAvatars(avatars);
    }
  }

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <TabsContent value="feed">
      <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
        <PostForm onPostCreated={fetchFeed} />
        {feed.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg shadow-md w-full max-w-[600px] ${
              item.is_announcement
                ? "bg-yellow-100 border-l-4 border-yellow-500 text-black"
                : "bg-white text-onlineBlue"
            }`}
            onClick={() => router.push(`/post/${item.id}`)} // 🔥 Click to navigate
          >
            {/* 🔥 User Avatar + Name + Timestamp */}
            <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
              <Link href={`/user/${item.user_id}`} passHref>
                <img
                  src={userAvatars[item.user_id] || "/bedkom-logo.png"}
                  alt={item.username}
                  className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer hover:opacity-80 transition"
                />
              </Link>
              <div>
                <Link href={`/user/${item.user_id}`} passHref>
                  <p className="font-bold hover:underline cursor-pointer">{item.username}</p>
                </Link>
                <p className="text-sm text-gray-500">{formatRelativeTime(item.created_at)}</p>
              </div>
            </div>

            {/* 🔥 Post Content */}
            <p className={`mt-2 ${item.is_announcement ? "font-semibold text-lg" : ""} whitespace-pre-wrap`}>
              {item.content ? formatPostContent(item.content) : ""}
            </p>

            {/* 🔥 Clickable Images */}
            {item.image_urls && item.image_urls.length > 0 && (
              <div className="mt-2 flex flex-col items-center space-y-2" onClick={(e) => e.stopPropagation()}>
                {item.image_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt="Post Image"
                    className="rounded-lg max-w-full cursor-pointer"
                    onClick={() => setFullscreenMedia({ url, type: "image" })}
                  />
                ))}
              </div>
            )}

            {/* 🔥 Clickable Videos */}
            {item.video_urls && item.video_urls.length > 0 && (
              <div className="mt-2 flex flex-col items-center space-y-2" onClick={(e) => e.stopPropagation()}>
                {item.video_urls.map((url, index) => (
                  <video
                    key={index}
                    className="rounded-lg max-w-full cursor-pointer"
                    onClick={() => setFullscreenMedia({ url, type: "video" })}
                  >
                    <source src={url} type="video/mp4" />
                  </video>
                ))}
              </div>
            )}

            {/* 🔥 Footer with Comment Count */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-gray-500 text-sm">
                🗨️ {item.comments?.[0]?.count ?? 0} Comments
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 Fullscreen Media Viewer (Reusable Component) */}
      <FullscreenMediaViewer media={fullscreenMedia} onClose={() => setFullscreenMedia(null)} />
    </TabsContent>
  );
}
