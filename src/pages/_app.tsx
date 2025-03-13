import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import ProtectedLayout from "@/components/ProtectedLayout"; // 🔥 Import the protection layout
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <ProtectedLayout>
        <Component {...pageProps} />
      </ProtectedLayout>
    </ClerkProvider>
  );
}
