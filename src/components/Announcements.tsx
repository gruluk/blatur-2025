import { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { fetchUserAvatars } from "@/utils/api"; // ✅ Import avatar fetching
import { formatRelativeTime } from "@/utils/time";
import { useUser } from "@clerk/nextjs"; // ✅ Get current user

type Announcement = {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  image_urls: string[] | null;
  video_urls: string[] | null;
};

export default function Announcements() {
  console.log("📢 Announcements component loaded");

  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.isAdmin === true;

  console.log("🔍 Is Admin?", isAdmin);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});

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

  async function fetchAnnouncements() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_announcement", true) // ✅ Only get announcements
      .order("created_at", { ascending: false });

    if (error) console.error("❌ Error fetching announcements:", error);
    else {
      console.log("📢 Fetched announcements:", data);
      setAnnouncements(data);

      console.log("User Metadata:", user?.publicMetadata);
      console.log("Is Admin:", user?.publicMetadata?.isAdmin);

      // Fetch user avatars
      const userIds = data.map((post) => post.user_id);
      const avatars = await fetchUserAvatars(userIds);
      setUserAvatars(avatars);
    }
  }

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <TabsContent value="announcements">
      <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
        {/* ✅ Only show post form for admins */}

        {announcements.length === 0 ? (
          <p className="text-gray-500 text-center">No announcements yet.</p>
        ) : (
          announcements.map((item) => (
            <Link className="w-full max-w-[600px]" key={item.id} href={`/post/${item.id}`} passHref>
              <div className="text-onlineBlue p-4 rounded-lg shadow-md cursor-pointer w-full mx-auto border bg-yellow-100 border-l-4 border-yellow-500 text-black">
                {/* 🔥 User Avatar + Name + Timestamp */}
                <div className="flex items-center space-x-3">
                  <img
                    src={userAvatars[item.user_id] || "/bedkom-logo.png"}
                    alt={item.username}
                    className="w-10 h-10 rounded-full border border-gray-300"
                  />
                  <div>
                    <p className="font-bold">{item.username}</p>
                    <p className="text-sm text-gray-500">{formatRelativeTime(item.created_at)}</p>
                  </div>
                </div>

                {/* 🔥 Announcement Content */}
                <p className="mt-2 font-semibold whitespace-pre-wrap">
                  {item.content ? formatPostContent(item.content) : ""}
                </p>

                {item.image_urls && item.image_urls.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {item.image_urls.map((url, index) => (
                      <img key={index} src={url} alt="Announcement Image" className="rounded-lg max-w-full" />
                    ))}
                  </div>
                )}

                {item.video_urls && (
                  <div className="mt-2 space-y-2">
                    {item.video_urls.map((url, index) => (
                      <video key={index} controls className="rounded-lg max-w-full">
                        <source src={url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </TabsContent>
  );
}
