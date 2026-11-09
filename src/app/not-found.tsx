import { LinkButton } from "@/components/ui/Button";
export default function NotFound() {
  return (<div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center"><p className="font-heading text-5xl font-extrabold text-forest">404</p><h1 className="mt-3 font-heading text-xl font-semibold">We could not find that page</h1><p className="mt-1 text-sm text-muted">The listing may have been rented, sold or removed.</p><div className="mt-5 flex gap-2"><LinkButton href="/">Home</LinkButton><LinkButton href="/search" variant="outline">Search</LinkButton></div></div>);
}
