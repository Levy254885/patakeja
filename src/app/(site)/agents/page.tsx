import Link from "next/link";
import { BadgeCheck, Users } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/content/ContentPage";
import { Avatar } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { listPublicProfiles } from "@/lib/server/firestore-rest";
import { pluralize } from "@/lib/format";
import type { PublicProfile } from "@/lib/types";

export const metadata = pageMeta("Agents and landlords", "Browse property agents and landlords listing on PataKeja.", "/agents");
export const revalidate = 300;

export default async function AgentsPage() {
  let rows: PublicProfile[] = [];
  try { rows = (await listPublicProfiles()).filter((p) => p.role === "agent" || p.role === "landlord"); } catch { /* empty state */ }
  rows.sort((a, b) => Number(!!b.verified) - Number(!!a.verified) || (b.listingCount ?? 0) - (a.listingCount ?? 0));
  return (
    <ContentPage title="Agents and landlords" intro="Listers with a public profile on PataKeja." wide>
      {rows.length === 0 ? <EmptyState icon={Users} title="No public profiles yet" message="Agents and landlords appear here once they publish a profile." /> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/agents/${p.id}`} className="flex h-full items-start gap-3 rounded border border-line bg-white p-4 hover:border-forest">
                <Avatar name={p.name} src={p.photo?.url} size={48} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-heading text-sm font-semibold text-charcoal"><span className="truncate">{p.companyName || p.name}</span>{p.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-forest" aria-label="Verified" />}</p>
                  <p className="text-xs capitalize text-muted">{p.role}{p.listingCount != null ? ` - ${pluralize(p.listingCount, "listing")}` : ""}</p>
                  {p.bio && <p className="mt-1 line-clamp-2 text-xs text-muted">{p.bio}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ContentPage>
  );
}
