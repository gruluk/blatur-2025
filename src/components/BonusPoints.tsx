import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "../../supabase";
import { useAuth } from "@clerk/nextjs";

type User = { id: string; firstName: string | null; lastName: string | null };

type BonusPointsProps = { users: User[] };

export default function BonusPoints({ users }: BonusPointsProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [points, setPoints] = useState<number | "">("");
  const [reason, setReason] = useState<string>(""); // ✅ Added reason input
  const [image, setImage] = useState<File | null>(null); // ✅ Added image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGrantPoints() {
    if (!selectedUser || !points || !userId) return;

    setIsSubmitting(true);

    let proofUrl = null;

    // ✅ Upload image if provided
    if (image) {
        const fileExt = image.name.split(".").pop();
        const filePath = `uploads/${selectedUser.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, image);

        if (uploadError) {
        console.error("❌ Error uploading image:", uploadError);
        setIsSubmitting(false)
        return;
        }

        // ✅ Get public URL from Supabase
        proofUrl = supabase.storage.from("uploads").getPublicUrl(filePath).data.publicUrl;
    }

    // ✅ Insert bonus points into `bonus_points` table
    const { error } = await supabase.from("bonus_points").insert([
        {
        user_id: selectedUser.id,
        points: points,
        granted_by: userId,
        granted_at: new Date().toISOString(),
        reason: reason || null, // ✅ Save reason
        proof_url: proofUrl, // ✅ Save image URL if available
        },
    ]);

    if (error) {
        console.error("❌ Error granting bonus points:", error);
        setIsSubmitting(false)
        return;
    }

    // ✅ Fetch user name for the feed post
    let userName = "Unknown User";
    try {
        const res = await fetch(`/api/get-user?userId=${selectedUser.id}`);
        if (res.ok) {
        const userData = await res.json();
        userName = userData.name || "Unknown User";
        }
    } catch (err) {
        console.error("❌ Error fetching user data:", err);
    }

    // ✅ Create a post announcing the bonus points
    let postContent = `🎖️ ${userName} just received +${points} bonus points!`;

    if (reason) {
        postContent += `\n\n📝 Reason: "${reason}"`;
    }

    const { error: postError } = await supabase.from("posts").insert([
        {
        user_id: selectedUser.id,
        username: userName,
        content: postContent,
        image_urls: proofUrl ? [proofUrl] : [],
        video_urls: [],
        is_announcement: false,
        event_type: "Bonus Points",
        },
    ]);

    if (postError) {
        console.error("❌ Error creating feed post:", postError);
        setIsSubmitting(false)
        return;
    }

    alert(`✅ Granted ${points} bonus points to ${selectedUser.firstName} ${selectedUser.lastName}`);
    setSelectedUser(null);
    setPoints("");
    setReason("");
    setImage(null);
    setImagePreview(null);
    setIsSubmitting(false)
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-300 max-w-xl w-full mx-auto mt-5">
      <h2 className="text-2xl font-bold text-center text-onlineBlue mb-5">✨ Grant Bonus Points</h2>

      {/* 🔥 Select User */}
      <p className="text-md font-bold text-start text-onlineBlue mb-2">Select a user</p>
      <select
        value={selectedUser?.id || ""}
        onChange={(e) => {
          const user = users.find((u) => u.id === e.target.value) || null;
          setSelectedUser(user);
          console.log("✅ Selected user:", user);
        }}
        className="w-full p-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-onlineBlue text-black mb-5"
      >
        <option value="">-- Select a user --</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.firstName} {user.lastName}
          </option>
        ))}
      </select>

      {/* 🔥 Input for Points */}
      <p className="text-md font-bold text-start text-onlineBlue mb-2">Select points</p>
      <Input
        type="number"
        placeholder="Enter bonus points"
        value={points}
        onChange={(e) => setPoints(Number(e.target.value))}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-onlineBlue text-black mb-5"
      />

      <p className="text-md font-bold text-start text-onlineBlue mb-2">Describe bonus point</p>
      <Textarea
        placeholder="Enter reason for bonus points..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-onlineBlue text-black mb-5"
      />

      {/* 🔥 File Upload */}
      <p className="text-md font-bold text-start text-onlineBlue mb-2">Upload evidence</p>
      <label className="w-full flex flex-col items-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg cursor-pointer hover:bg-blue-700 mt-2">
        <span className="text-sm">📸 Choose Image/Video</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setImage(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
        />
      </label>

      {/* 🔥 Image Preview */}
      {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 rounded-lg max-w-[200px] border" />}

      <Button
        onClick={handleGrantPoints} // ✅ Add this
        disabled={isSubmitting}
        className={`w-full text-white font-bold py-2 px-4 rounded-md transition mt-5 ${
          isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-onlineBlue hover:bg-blue-700"
        }`}
      >
        {isSubmitting ? "Granting..." : "✅ Grant Points"}
      </Button>
    </div>
  );
}