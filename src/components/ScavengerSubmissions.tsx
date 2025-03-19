import { useState, useEffect } from "react";
import { supabase } from "../../supabase";

// Define the type for a submission
interface ScavengerSubmission {
  id: string;
  media_url: string;
  status: "pending" | "approved" | "rejected";
}

export default function ScavengerSubmissions() {
  const [submissions, setSubmissions] = useState<ScavengerSubmission[]>([]);

  useEffect(() => {
    async function fetchSubmissions() {
      const { data, error } = await supabase.from("scavenger_submissions").select("*").eq("status", "pending");
      if (error) {
        console.error("Error fetching submissions:", error);
      } else if (data) {
        setSubmissions(data);
      }
    }
    fetchSubmissions();
  }, []);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">📷 Pending Submissions</h3>
      {submissions.length === 0 ? (
        <p>No pending submissions.</p>
      ) : (
        <ul>
          {submissions.map((sub) => (
            <li key={sub.id}>
              <a href={sub.media_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                View Submission
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
