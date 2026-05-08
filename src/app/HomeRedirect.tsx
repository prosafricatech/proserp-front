"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check for authData in localStorage
    const authData = typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    if (authData) {
      // If session exists, redirect to dashboard (or your main app route)
      router.replace("/en-US/dashboard");
    } else {
      // If not authenticated, redirect to sign in
      router.replace("/en-US/auth/signin");
    }
  }, [router]);

  return null;
}
