import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../supabase";

export default function ScavengerHuntCard() {
  const router = useRouter();
  const [isScavengerHuntLive, setIsScavengerHuntLive] = useState<boolean>(false);

  useEffect(() => {
    async function fetchScavengerHuntStatus() {
      const { data, error } = await supabase
        .from("scavenger_events")
        .select("status")
        .single(); // ✅ Assuming only one event

      if (error) {
        console.error("❌ Error fetching scavenger hunt status:", error);
      } else {
        setIsScavengerHuntLive(data?.status === "live");
      }
    }

    fetchScavengerHuntStatus();
  }, []);

  if (!isScavengerHuntLive) return null; // ✅ Hide if event is not live

  return (
    <div
        className="w-full max-w-lg p-4 bg-white border-yellow-500 border-4 text-black font-bold rounded-lg text-center cursor-pointer hover:bg-yellow-400"
        onClick={() => router.push("/scavenger-hunt/team")}
    >
        <h2 className="text-xl text-onlineBlue">Rebus</h2>
        <p className="text-sm font-normal text-onlineBlue">Klikk her for å gå til ditt lag</p>
    </div>
  );
}
