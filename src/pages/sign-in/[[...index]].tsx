import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-4 bg-onlineBlue text-onlineOrange">
      {/* 🔥 Instructional Text */}
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 px-2">
        Bruk Online-eposten for å logge inn!
      </h1>

      {/* 🔥 Sign-In Component */}
      <div className="w-full max-w-sm sm:max-w-md">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  );
}
