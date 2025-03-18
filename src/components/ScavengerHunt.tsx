import ScavengerTasks from "./ScavengerTasks";
import ScavengerTeams from "./ScavengerTeams";
import ScavengerSubmissions from "./ScavengerSubmissions";
import ScavengerJudging from "./ScavengerJudging";

export default function ScavengerHunt() {
  return (
    <div>
      <ScavengerTasks />
      <ScavengerTeams />
      <ScavengerSubmissions />
      <ScavengerJudging />
    </div>
  );
}
