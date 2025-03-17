import Header from "@/components/Header";

export default function NotInTeam() {
  return (
    <div>
      <Header />
      <div className="mt-20 text-center p-6 bg-white shadow-md rounded-lg max-w-md mx-auto">
        <h1 className="text-xl font-bold text-red-600">🚨 You are not in a team!</h1>
        <p className="text-gray-600 mt-2">Please contact an admin to be assigned to a team.</p>
      </div>
    </div>
  );
}
