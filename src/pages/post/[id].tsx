import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../supabase";
import Header from "@/components/Header";
import PostForm from "@/components/PostForm";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fetchUserAvatars } from "@/utils/api";
import Link from "next/link";
import Image from "next/image";

type Comment = {
  id: string;
  username: string;
  content: string;
  image_urls: string[] | null;
  video_urls: string[] | null;
  created_at: string;
  user_id: string;
};

type Post = {
  id: string;
  user_id: string;
  username: string;
  content: string | null;
  image_urls: string[] | null;
  video_urls: string[] | null;
  created_at: string;
};

// 🔥 Fetch User Avatar from API
const fetchUserAvatar = async (userId: string) => {
  try {
    const response = await fetch("/api/getUserAvatars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId] }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user avatar");
    }

    const avatars = await response.json();
    return avatars[userId] || "/bedkom-logo.png";
  } catch (error) {
    console.error("❌ Error fetching avatar:", error);
    return "/bedkom-logo.png";
  }
};

export default function PostPage() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});

  const fetchComments = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching comments:", error);
    } else {
      setComments(data || []);

      // 🔥 Fetch avatars for users in comments
      const userIds = data.map((comment) => comment.user_id);
      const avatars = await fetchUserAvatars(userIds);
      setUserAvatars(avatars); // ✅ Store avatars in state
    }
    setLoadingComments(false);
  }, [id]);

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      const { data } = await supabase.from("posts").select("*").eq("id", id).single();

      if (data) {
        setPost(data);
        const avatar = await fetchUserAvatar(data.user_id);
        setUserAvatar(avatar);
      }

      setLoadingPost(false);
    }

    fetchPost();
    fetchComments();
  }, [id, fetchComments]);

  return (
    <div className="bg-onlineBlue text-white p-6 flex flex-col items-center mt-15">
      <Header />

      {/* 🔥 Post Section (Fixed Width & Responsive) */}
      <div className="bg-white text-onlineBlue p-4 rounded-lg shadow-md cursor-pointer w-full max-w-[600px] mx-auto mb-5">
        {loadingPost ? (
          <Skeleton className="h-[120px] w-full rounded-lg" />
        ) : (
          <>
            {/* 🔥 User Avatar + Clickable Name */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer hover:opacity-80 transition overflow-hidden">
                <Link href={`/user/${post?.user_id}`} passHref>
                  <Image
                    src={userAvatar || "/bedkom-logo.png"}
                    alt={post?.username || "User"}
                    width={40}
                    height={40}
                  />
                </Link>
              </div>
              <div>
                <Link href={`/user/${post?.user_id}`} passHref>
                  <p className="font-bold hover:underline cursor-pointer">{post?.username || "Unknown User"}</p>
                </Link>
                <p className="text-sm text-gray-500">
                  {post?.created_at
                    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                    : "Unknown time"}
                </p>
              </div>
            </div>

            <p className="whitespace-pre-wrap">{post?.content}</p>

            {/* Display images & videos */}
            {post?.image_urls?.map((url, index) => (
              <Image key={index} src={url} alt="Post Image" width={600} height={400} className="rounded-lg max-w-full mt-2" />
            ))}
            {post?.video_urls?.map((url, index) => (
              <video key={index} controls className="rounded-lg max-w-full mt-2">
                <source src={url} type="video/mp4" />
              </video>
            ))}
          </>
        )}
      </div>

      <PostForm postId={id as string} onPostCreated={fetchComments} />

      {/* 🔥 Comment Section (Fixed Width & Responsive) */}
      <div className="mt-6 bg-white text-onlineBlue p-4 rounded-lg shadow-md cursor-pointer w-full max-w-[600px] mx-auto">
        <h2 className="font-bold text-lg">Comments</h2>

        {/* 🔥 Comments Loading Skeleton */}
        {loadingComments ? (
          <div className="mt-4 space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-200 animate-pulse">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 border rounded-lg bg-gray-100">
                  {/* 🔥 User Avatar + Clickable Name */}
                  <div className="flex items-center space-x-3 mb-2">
                    <Link href={`/user/${comment.user_id}`} passHref>
                      <Image
                        src={userAvatars[comment.user_id] || "/bedkom-logo.png"} // ✅ Dynamic avatar
                        alt={comment.username}
                        width={40}
                        height={40}
                        className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer hover:opacity-80 transition"
                      />
                    </Link>
                    <div>
                      <Link href={`/user/${comment.user_id}`} passHref>
                        <p className="font-bold hover:underline cursor-pointer">{comment.username}</p>
                      </Link>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <p>{comment.content}</p>

                  {/* Display images */}
                  {Array.isArray(comment.image_urls) && comment.image_urls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {comment.image_urls.map((url, index) => (
                        <Image key={index} src={url} alt="Comment Image" width={150} height={150} className="rounded-lg max-w-full" />
                      ))}
                    </div>
                  )}

                  {/* Display videos */}
                  {Array.isArray(comment.video_urls) && comment.video_urls.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {comment.video_urls.map((url, index) => (
                        <video key={index} controls className="rounded-lg max-w-full">
                          <source src={url} type="video/mp4" />
                        </video>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
