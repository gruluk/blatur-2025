import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
