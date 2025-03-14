import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "../../supabase";
import { useAuth } from "@clerk/nextjs";
import { Check, ChevronsUpDown, Upload } from "lucide-react";
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
        return;
        }

        // ✅ Get public URL from Supabase
        proofUrl = supabase.storage.from("uploads").getPublicUrl(filePath).data.publicUrl;
    }

    // ✅ Insert bonus points into DB
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
        return;
    }

    alert(`✅ Granted ${points} bonus points to ${selectedUser.firstName} ${selectedUser.lastName}`);
    setSelectedUser(null);
    setPoints("");
    setReason("");
    setImage(null);
    setImagePreview(null);
  }

  return (
    <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-center">✨ Grant Bonus Points</h2>

      {/* 🔥 Select User */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
            {selectedUser ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() : "Select a user..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search user..." className="h-9" />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem key={user.id} value={user.id} onSelect={() => { setSelectedUser(user); setOpen(false); }}>
                    {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                    <Check className={`ml-auto ${selectedUser?.id === user.id ? "opacity-100" : "opacity-0"}`} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 🔥 Input for Points */}
      <Input type="number" placeholder="Enter bonus points" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="mb-2" />

      {/* 🔥 Input for Reason */}
      <Textarea placeholder="Enter reason for bonus points..." value={reason} onChange={(e) => setReason(e.target.value)} className="mb-2" />

      {/* 🔥 File Upload */}
      <label className="flex items-center space-x-2 cursor-pointer">
        <Upload className="h-5 w-5 text-gray-500" />
        <span className="text-sm">Upload Image (Optional)</span>
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

      {/* 🔥 Grant Points Button */}
      <Button onClick={handleGrantPoints} className="w-full bg-green-600 hover:bg-green-700">
        ✅ Grant Points
      </Button>
    </div>
  );
}
