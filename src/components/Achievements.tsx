import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "../../supabase";
import { Achievement } from "@/hooks/useJudgeData";

type Props = {
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
};

export default function Achievements({ achievements, setAchievements }: Props) {
  const [newAchievement, setNewAchievement] = useState<Partial<Achievement>>({ title: "", description: "", points: 0 });

  async function handleCreateAchievement() {
    if (!newAchievement.title || !newAchievement.description || !newAchievement.points) return;

    const { data, error } = await supabase.from("achievements").insert([newAchievement]).select("*");

    if (error) {
      console.error("❌ Error adding achievement:", error);
      return;
    }

    setAchievements([...achievements, ...data]);
    setNewAchievement({ title: "", description: "", points: 0 });
  }

  return (
    <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-center">🏆 Manage Achievements</h2>
      {achievements.map((achievement) => (
        <div key={achievement.id} className="p-4 rounded-lg shadow-md bg-white text-onlineBlue w-full">
          <h2 className="text-lg font-bold">{achievement.title}</h2>
          <p className="text-gray-600">{achievement.description}</p>
          <p className="text-gray-500">🏆 {achievement.points} Points</p>
        </div>
      ))}

      <div className="w-full p-4 bg-white text-onlineBlue rounded-lg shadow-md">
        <h3 className="text-lg font-bold mb-2">➕ Add New Achievement</h3>
        <Input placeholder="Title" value={newAchievement.title} onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })} />
        <Input placeholder="Description" value={newAchievement.description} onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })} />
        <Input type="number" placeholder="Points" value={newAchievement.points} onChange={(e) => setNewAchievement({ ...newAchievement, points: Number(e.target.value) })} />
        <Button onClick={handleCreateAchievement} className="w-full bg-green-600 hover:bg-green-700">✅ Create Achievement</Button>
      </div>
    </div>
  );
}
