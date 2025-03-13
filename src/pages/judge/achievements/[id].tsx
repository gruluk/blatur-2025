import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../../../supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditAchievement() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [achievement, setAchievement] = useState({
    title: "",
    description: "",
    points: 0,
    images: [] as string[],
  });

  useEffect(() => {
    if (!id) return;

    async function fetchAchievement() {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Error fetching achievement:", error);
        return;
      }

      setAchievement({ ...data, images: data.images ?? [] });
      setLoading(false);
    }

    fetchAchievement();
  }, [id]);

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploadedUrls: string[] = [...achievement.images];

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const filePath = `achievements/${id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error } = await supabase.storage.from("uploads").upload(filePath, file);
      if (error) {
        console.error("❌ Error uploading image:", error);
        setUploading(false);
        return;
      }

      const { publicUrl } = supabase.storage.from("uploads").getPublicUrl(filePath).data;
      uploadedUrls.push(publicUrl);
    }

    const { error: updateError } = await supabase
      .from("achievements")
      .update({ images: uploadedUrls })
      .eq("id", id);

    if (updateError) {
      console.error("❌ Error updating achievement images:", updateError);
      setUploading(false);
      return;
    }

    setAchievement((prev) => ({ ...prev, images: uploadedUrls }));
    setUploading(false);
  }

  async function handleDeleteImage(imageUrl: string) {
    // Remove from UI immediately
    const updatedImages = achievement.images.filter((img) => img !== imageUrl);
    setAchievement((prev) => ({ ...prev, images: updatedImages }));

    // Get the file path from the public URL
    const filePath = imageUrl.split("/uploads/")[1];

    // Delete from storage
    const { error } = await supabase.storage.from("uploads").remove([filePath]);

    if (error) {
      console.error("❌ Error deleting image:", error);
      return;
    }

    // Update database
    const { error: updateError } = await supabase
      .from("achievements")
      .update({ images: updatedImages })
      .eq("id", id);

    if (updateError) {
      console.error("❌ Error updating achievement images:", updateError);
    }
  }

  async function handleSave() {
    setSaving(true);

    const { error } = await supabase.from("achievements").update(achievement).eq("id", id);

    if (error) {
      console.error("❌ Error updating achievement:", error);
      return;
    }

    alert("✅ Achievement updated!");
    setSaving(false);
    router.push("/judge");
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white p-6 flex flex-col items-center">
        <Header />
        <h1 className="text-3xl font-bold text-center mb-6 mt-15">🏆 Edit Achievement</h1>
        <div className="w-full max-w-2xl bg-white text-onlineBlue p-6 rounded-lg shadow-md">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-2/3 mb-2" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center">
      <Header />
      <h1 className="text-3xl font-bold text-center mb-6 mt-15">🏆 Edit Achievement</h1>

      <div className="w-full max-w-2xl bg-white text-onlineBlue p-6 rounded-lg shadow-md">
        {/* Preview Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold">{achievement.title || "Preview Title"}</h2>
          <p className="text-gray-600">{achievement.description || "Preview Description"}</p>
          <p className="text-gray-500">🏆 {achievement.points || "0"} Points</p>
        </div>

        {/* Image Previews with Delete Buttons */}
        {achievement.images.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {achievement.images.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt={`Achievement ${idx}`} className="h-24 w-24 object-cover rounded-lg" />
                <button
                  onClick={() => handleDeleteImage(img)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Editable Fields */}
        <Input
          placeholder="Title"
          value={achievement.title}
          onChange={(e) => setAchievement((prev) => ({ ...prev, title: e.target.value }))}
          className="mb-2"
        />

        {/* 🔥 Multi-line Description Field */}
        <textarea
          placeholder="Description"
          value={achievement.description}
          onChange={(e) => setAchievement((prev) => ({ ...prev, description: e.target.value }))}
          className="mb-2 w-full p-2 border border-gray-300 rounded-md text-onlineBlue h-24 resize-none"
        />

        <Input
          type="number"
          placeholder="Points"
          value={achievement.points}
          onChange={(e) => setAchievement((prev) => ({ ...prev, points: Number(e.target.value) }))}
          className="mb-4"
        />

        {/* Styled File Upload Button */}
        <label className="w-full flex flex-col items-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg cursor-pointer hover:bg-blue-700">
          📸 Choose Images
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)}
          />
        </label>

        {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full bg-green-600 hover:bg-green-700 mt-4" disabled={saving || uploading}>
          {saving ? "Saving..." : "💾 Save Changes"}
        </Button>
      </div>
    </div>
  );
}
