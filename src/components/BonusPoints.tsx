import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "../../supabase";
import { useAuth } from "@clerk/nextjs";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type User = { id: string; firstName: string | null; lastName: string | null };

export default function BonusPoints() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [points, setPoints] = useState<number | "">("");
  const [reason, setReason] = useState<string>(""); // ✅ Added reason input
  const [image, setImage] = useState<File | null>(null); // ✅ Added image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid user data format");
        setUsers(data);
      } catch (error) {
        console.error("❌ Error fetching users:", error);
      }
    }
    fetchUsers();
  }, []);

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
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-300 max-w-xl w-full mx-auto">
      <h2 className="text-2xl font-bold text-center text-onlineBlue mb-5">✨ Grant Bonus Points</h2>

      {/* 🔥 Select User */}
      <p className="text-md font-bold text-start text-onlineBlue mb-2">Select a user</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between text-black mb-5">
            {selectedUser ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() : "Select a user..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0 text-black">
          <Command>
            <CommandInput placeholder="Search user..." />
            <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                {users.map((user) => (
                    <CommandItem
                    key={user.id}
                    onSelect={() => {
                        setSelectedUser(user);
                        setOpen(false);
                    }}
                    >
                    {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                    {selectedUser?.id === user.id && <Check className="ml-auto opacity-100" />}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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
        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
          }
        }} />
      </label>

      {/* 🔥 Image Preview */}
      {imagePreview && (
        <img src={imagePreview} alt="Preview" className="mt-2 rounded-lg max-w-[200px] border" />
      )}

      <Button
        onClick={handleGrantPoints}
        disabled={isSubmitting} // ✅ Disable button while submitting
        className={`w-full text-white font-bold py-2 px-4 rounded-md transition mt-5 ${
            isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-onlineBlue hover:bg-blue-700"
        }`}
        >
        {isSubmitting ? "Granting..." : "✅ Grant Points"}
      </Button>
    </div>
  );
}
