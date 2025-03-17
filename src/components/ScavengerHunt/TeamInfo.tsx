export default function TeamInfo({ teamName }) {
  return (
    <div className="p-4 bg-blue-100 border-l-4 border-blue-600 rounded-lg w-full shadow-md">
      <h2 className="text-lg font-semibold text-blue-800">Your Team: {teamName}</h2>
    </div>
  );
}
