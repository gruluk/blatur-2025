import { useState } from "react";
import { supabase } from "../../supabase";
import { useUser } from "@clerk/nextjs";

export default function PostForm({
  onPostCreated,
  postId = null, // If postId is provided, it's a comment
}: {
  onPostCreated: () => void;
  postId?: string | null;
}) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false); // ✅ New state for admin toggle

  // ✅ Check if the user is an admin
  const isAdmin = user?.publicMetadata?.isAdmin === true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsUploading(true);

    const uploadedImageUrls: string[] = [];
    const uploadedVideoUrls: string[] = [];

    // 🔥 Upload files to Supabase Storage
    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error } = await supabase.storage.from("uploads").upload(filePath, file);

        if (error) {
          console.error("❌ Upload error:", error);
          setIsUploading(false);
          return;
        }

        const { publicUrl } = supabase.storage.from("uploads").getPublicUrl(filePath).data;

        if (file.type.startsWith("image")) uploadedImageUrls.push(publicUrl);
        if (file.type.startsWith("video")) uploadedVideoUrls.push(publicUrl);
      }
    }

    // 🔥 Insert into either `posts` or `comments`
    const tableName = postId ? "comments" : "posts";

    const newItem: {
      user_id: string;
      username: string;
      content: string;
      image_urls: string[];
      video_urls: string[];
      post_id?: string;
      is_announcement?: boolean; // ✅ Optional announcement flag
    } = {
      user_id: user.id,
      username: user.fullName || "Anonymous",
      content,
      image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : [],
      video_urls: uploadedVideoUrls.length > 0 ? uploadedVideoUrls : [],
    };

    if (postId) {
      newItem.post_id = postId;
    }

    // ✅ Set `is_announcement: true` only if admin selects it
    if (!postId && isAdmin && isAnnouncement) {
      newItem.is_announcement = true;
    }

    const { error: insertError } = await supabase.from(tableName).insert([newItem]);

    if (insertError) {
      console.error(`❌ Error submitting ${postId ? "comment" : "post"}:`, insertError);
    } else {
      setContent("");
      setFiles([]);
      setIsAnnouncement(false); // ✅ Reset toggle after post
      onPostCreated();
    }

    setIsUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  return (
    <div className="bg-white text-onlineBlue p-4 rounded-lg shadow-md cursor-pointer w-full max-w-[600px] mx-auto">
      <h2 className="text-lg font-bold text-onlineBlue">
        {postId ? "Write a Comment" : "Create a Post"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3 mt-2">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md text-onlineBlue"
          placeholder={postId ? "Skriv en gruu kommentar..." : "Skriv noe gruu..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* 🔥 Admins Only: Toggle Announcement */}
        {isAdmin && !postId && (
          <label className="flex items-center space-x-2 text-sm font-medium text-onlineBlue">
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={() => setIsAnnouncement(!isAnnouncement)}
              className="w-4 h-4"
            />
            <span>📢 Mark as Announcement</span>
          </label>
        )}

        {/* Hidden File Input */}
        <input
          id={`fileInput-${postId || "post"}`}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Media Button */}
        <button
          type="button"
          onClick={() => document.getElementById(`fileInput-${postId || "post"}`)?.click()}
          className="px-4 py-2 bg-gray-300 text-onlineBlue font-bold rounded-lg hover:bg-gray-400"
        >
          📷 Upload Media
        </button>

        {/* Show Selected Files */}
        {files.length > 0 && (
          <div className="mt-2 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="text-sm text-gray-600">
                {file.name}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className="px-4 py-2 bg-onlineOrange text-onlineBlue font-bold rounded-lg hover:bg-yellow-400"
        >
          {isUploading ? "Uploading..." : postId ? "Comment" : "Post"}
        </button>
      </form>
    </div>
  );
}
