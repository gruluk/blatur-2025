import ScavengerTasks from "./ScavengerTasks";
import ScavengerTeams from "./ScavengerTeams";
import ScavengerSubmissions from "./ScavengerSubmissions";

export default function ScavengerHunt() {
  return (
    <div>
      <ScavengerTasks />
      <ScavengerTeams />
      <ScavengerSubmissions />
    </div>
  );
}
