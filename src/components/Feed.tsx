import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../supabase";
import PostForm from "./PostForm";
import { TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { formatRelativeTime } from "@/utils/time";
import FullscreenMediaViewer from "@/components/FullscreenMediaViewer";
import Image from "next/image";
import ScavengerHuntCard from "./ScavengerHuntCard";

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

const POSTS_PER_PAGE = 10; // ✅ Number of posts per load

export default function Feed() {
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);

  // ✅ Function to format links inside post content
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

  async function fetchUserAvatars(userIds: string[]) {
    if (userIds.length === 0) return;

    try {
      const response = await fetch("/api/getUserAvatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      });

      if (!response.ok) throw new Error("Failed to fetch user avatars");

      const avatars = await response.json();
      setUserAvatars((prevAvatars) => ({ ...prevAvatars, ...avatars })); // ✅ Update state
    } catch (error) {
      console.error("❌ Error fetching avatars:", error);
    }
  }

  // ✅ Function to fetch paginated posts
  async function fetchFeed(offset = 0, append = false) {
    if (loading || !hasMore) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select("*, comments(count)")
      .order("created_at", { ascending: false })
      .range(offset, offset + POSTS_PER_PAGE - 1);

    if (error) {
      console.error("❌ Error fetching feed:", error);
      setLoading(false);
      return;
    }

    if (data.length < POSTS_PER_PAGE) setHasMore(false);

    setFeed((prevFeed) => {
      const existingIds = new Set(prevFeed.map((post) => post.id));
      const newUniquePosts = data.filter((post) => !existingIds.has(post.id));
      return append ? [...prevFeed, ...newUniquePosts] : data;
    });

    setOffset(offset + POSTS_PER_PAGE);

    // ✅ Fetch user avatars
    const userIds = [...new Set(data.map((post) => post.user_id))]; // Get unique user IDs
    fetchUserAvatars(userIds);

    setLoading(false);
  }

  // ✅ Function to observe last post and load more
  useEffect(() => {
    if (observer.current instanceof IntersectionObserver) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchFeed(offset, true);
        }
      },
      { threshold: 1.0 }
    );

    if (lastPostRef.current) observer.current.observe(lastPostRef.current);

    return () => {
      if (observer.current instanceof IntersectionObserver) {
        observer.current.disconnect();
      }
    };
  }, [feed]);

  // ✅ Initial Fetch
  useEffect(() => {
    fetchFeed(0);
  }, []);

  return (
    <TabsContent value="feed">
      <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
        <ScavengerHuntCard />
        <PostForm onPostCreated={() => fetchFeed(0)} />
        {feed.map((item, index) => (
          <div
            key={item.id}
            className={`feed-post p-4 rounded-lg shadow-md w-full max-w-[600px] ${
              item.is_announcement
                ? "bg-yellow-100 border-l-4 border-yellow-500 text-black"
                : "bg-white text-onlineBlue"
            }`}
            ref={index === feed.length - 1 ? lastPostRef : null}
            onClick={() => router.push(`/post/${item.id}`)}
          >
            {/* 🔥 User Avatar + Name + Timestamp */}
            <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
              <Link href={`/user/${item.user_id}`} passHref>
                <Image
                  src={userAvatars[item.user_id] || "/bedkom-logo.png"}
                  alt={item.username}
                  width={40} // ✅ Set width
                  height={40} // ✅ Set height
                  className="rounded-full border border-gray-300 cursor-pointer hover:opacity-80 transition"
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
                  <Image
                    key={index}
                    src={url}
                    alt="Post Image"
                    width={600} // ✅ Set width
                    height={400} // ✅ Set height
                    className="rounded-lg cursor-pointer"
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
                    width={600}
                    height={400}
                    controls // ✅ Requires user interaction to play
                    poster="/video-thumbnail.jpg" // ✅ Use an actual thumbnail
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

        {/* 🔄 Loading Indicator */}
        {loading && <p className="text-gray-500 text-sm">Loading more posts...</p>}
      </div>

      {/* 🔥 Fullscreen Media Viewer (Reusable Component) */}
      <FullscreenMediaViewer media={fullscreenMedia} onClose={() => setFullscreenMedia(null)} />
    </TabsContent>
  );
}
