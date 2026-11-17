"use client";
import { Button } from "@/components/ui/Button";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (<div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center"><h1 className="font-heading text-xl font-semibold">Something went wrong</h1><p className="mt-1 text-sm text-muted">Please try again. If it keeps happening, contact support.</p><Button className="mt-5" onClick={reset}>Try again</Button></div>);
}
