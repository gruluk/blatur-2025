import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-onlineBlue text-onlineOrange">
      {/* 🔥 Instructional Text */}
      <h1 className="text-2xl font-bold mb-4">Bruk Online-eposten for å logge inn!</h1>

      {/* 🔥 Sign-In Component */}
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
