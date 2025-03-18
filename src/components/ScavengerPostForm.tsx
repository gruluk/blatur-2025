import { useState } from "react";
import { supabase } from "../../supabase";
import { useUser } from "@clerk/nextjs";

export default function ScavengerPostForm({
  onPostCreated,
  teamId,
}: {
  onPostCreated: () => void;
  teamId: string;
}) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
        const filePath = `scavenger-feed/${teamId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error } = await supabase.storage.from("scavenger_media").upload(filePath, file);

        if (error) {
          console.error("❌ Upload error:", error);
          setIsUploading(false);
          return;
        }

        const { publicUrl } = supabase.storage.from("scavenger_media").getPublicUrl(filePath).data;

        if (file.type.startsWith("image")) uploadedImageUrls.push(publicUrl);
        if (file.type.startsWith("video")) uploadedVideoUrls.push(publicUrl);
      }
    }

    // 🔥 Insert into `scavenger_feed`
    const { error: insertError } = await supabase.from("scavenger_feed").insert([{
        team_id: teamId,
        user_id: user.id,
        username: user.fullName || "Anonymous",
        content,
        media_urls: [...uploadedImageUrls, ...uploadedVideoUrls], // ✅ Use media_urls
        created_at: new Date().toISOString(),
    }]);

    if (insertError) {
      console.error("❌ Error submitting post:", insertError);
    } else {
      setContent("");
      setFiles([]);
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
    <div className="bg-white text-black p-4 rounded-lg shadow-md w-full max-w-[600px] mx-auto">
      <h2 className="text-lg font-bold">💬 Post in Team Feed</h2>
      <form onSubmit={handleSubmit} className="space-y-3 mt-2">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="Write something for your team..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Hidden File Input */}
        <input
          id="fileInput"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Media Button */}
        <button
          type="button"
          onClick={() => document.getElementById("fileInput")?.click()}
          className="px-4 py-2 bg-gray-300 text-black font-bold rounded-lg hover:bg-gray-400"
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
          className="px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
        >
          {isUploading ? "Uploading..." : "Post"}
        </button>
      </form>
    </div>
  );
}
