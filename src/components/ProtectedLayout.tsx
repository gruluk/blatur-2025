import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn === false) {
      router.push("/sign-in"); // 🚀 Redirect to login if not signed in
    }
  }, [isSignedIn, router]);

  // 🔥 Show nothing while checking auth state
  if (isSignedIn === undefined) return null;

  return <>{children}</>;
}
