import Link from "next/link";
import Image from "next/image";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { FaHome, FaTrophy, FaGavel, FaUser } from "react-icons/fa"; // ✅ Import User Icon

export default function Header() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const isHome = router.pathname === "/";
  const isAchievements = router.pathname === "/submit";
  const isJudgePanel = router.pathname === "/judge";
  const isUserProfile = router.pathname.startsWith("/user"); // ✅ Highlight if viewing user profile

  // ✅ Check if the user is an admin
  const isAdmin = user?.publicMetadata?.isAdmin === true;

  return (
    <div className="fixed top-0 left-0 w-full flex items-center justify-between px-4 py-3 bg-onlineBlue shadow-md z-50">
      {/* Left Side: Home, Achievements, Logo */}
      <div className="flex items-center space-x-4">
        {/* 🌟 Logo */}
        <Link href="/" className="flex items-center space-x-2 cursor-pointer">
          <Image src="/bedkom-logo.png" alt="Online Logo" width={40} height={40} className="w-10 h-10" />
        </Link>

        {/* 🏠 Home Icon */}
        <Link
          href="/"
          className={`p-2 rounded-lg ${
            isHome ? "bg-onlineOrange text-onlineBlue" : "text-white hover:bg-onlineOrange hover:text-onlineBlue"
          }`}
        >
          <FaHome size={24} />
        </Link>

        {/* 🏆 Achievements Icon */}
        {isSignedIn && (
          <Link
            href="/submit"
            className={`p-2 rounded-lg ${
              isAchievements ? "bg-onlineOrange text-onlineBlue" : "text-white hover:bg-onlineOrange hover:text-onlineBlue"
            }`}
          >
            <FaTrophy size={24} />
          </Link>
        )}

        {/* ⚖️ Judge Icon (Only for Admins) */}
        {isSignedIn && isAdmin && (
          <Link
            href="/judge"
            className={`p-2 rounded-lg ${
              isJudgePanel ? "bg-onlineOrange text-onlineBlue" : "text-white hover:bg-onlineOrange hover:text-onlineBlue"
            }`}
          >
            <FaGavel size={24} />
          </Link>
        )}

        {/* 👤 User Profile Icon */}
        {isSignedIn && user && (
          <Link
            href={`/user/${user.id}`} // ✅ Navigate to the user's profile
            className={`p-2 rounded-lg ${
              isUserProfile ? "bg-onlineOrange text-onlineBlue" : "text-white hover:bg-onlineOrange hover:text-onlineBlue"
            }`}
          >
            <FaUser size={24} />
          </Link>
        )}
      </div>

      {/* Right Side: User Button / Login */}
      <div className="flex items-center space-x-4">
        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <Link href="/sign-in">
            <button className="px-3 py-2 text-sm md:text-base bg-onlineOrange text-onlineBlue font-bold rounded-lg hover:bg-yellow-400">
              Log In
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
