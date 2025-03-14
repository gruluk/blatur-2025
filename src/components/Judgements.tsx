import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Submission } from "@/hooks/useJudgeData";

type Props = {
  loading: boolean;
  submissions: Submission[];
  judgedSubmissions: Submission[];
};

export default function Judgements({ loading, submissions, judgedSubmissions }: Props) {
  return (
    <div>
      {loading ? (
        <div className="flex flex-col items-center space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full max-w-[600px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-center">🕒 Venter på dommer</h2>
          {submissions.map((submission) => (
            <Link key={submission.id} href={`/judge/${submission.id}`} passHref className="w-full max-w-2xl mx-auto">
              <div className="p-4 rounded-lg shadow-md cursor-pointer bg-white text-onlineBlue">
                <h2 className="text-lg font-bold">{submission.achievements.title}</h2>
                <p className="text-sm text-gray-700">👤 {submission.users.name}</p> {/* ✅ Add user name */}
                <p className="text-gray-600">🏆 {submission.achievements.points} Points</p>
                <p className="text-xs text-gray-400">🕒 {new Date(submission.created_at).toLocaleString()}</p>
              </div>
            </Link>
          ))}

          <h2 className="mt-10 text-2xl font-bold text-center">📜 Tidligere dommer</h2>
          {judgedSubmissions.map((submission) => (
            <Link key={submission.id} href={`/judge/${submission.id}`} passHref className="w-full max-w-2xl mx-auto">
              <div className="p-4 rounded-lg shadow-md cursor-pointer bg-white text-onlineBlue">
                <h2 className="text-lg font-bold">{submission.achievements.title}</h2>
                <p className="text-sm text-gray-700">👤 {submission.users.name}</p> {/* ✅ Add user name */}
                <p className="text-gray-600">🏆 {submission.achievements.points} Points</p>
                <p className="text-xs text-gray-400">🕒 {new Date(submission.created_at).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
