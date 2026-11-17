"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/States";

export default function AccountHelpRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/help"); }, [router]);
  return <Spinner />;
}
