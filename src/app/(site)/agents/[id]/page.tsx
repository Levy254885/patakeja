import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/content/ContentPage";
import { AgentListings } from "@/components/content/AgentListings";
import { Avatar } from "@/components/ui/Misc";
import { getPublicProfile } from "@/lib/server/firestore-rest";
import type { PublicProfile } from "@/lib/types";

export const revalidate = 300;

async function load(id: string): Promise<PublicProfile | null> {
  try { return await getPublicProfile(id); } catch { return null; }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await load(params.id);
  return p ? pageMeta(`${p.companyName || p.name} on PataKeja`, p.bio?.slice(0, 150) || `Listings by ${p.name} on PataKeja.`, `/agents/${p.id}`) : pageMeta("Agent", "PataKeja agent profile", "/agents");
}

export default async function AgentPage({ params }: { params: { id: string } }) {
  const p = await load(params.id);
  if (!p) notFound();
  return (
    <ContentPage title={p.companyName || p.name} crumbs={[{ label: "Agents", href: "/agents" }]} wide>
      <div className="mb-8 flex items-start gap-4">
        <Avatar name={p.name} src={p.photo?.url} size={64} />
        <div>
          <p className="flex items-center gap-1.5 text-sm text-muted"><span className="capitalize">{p.role}</span>{p.companyName && <span>- {p.name}</span>}{p.verified && <span className="inline-flex items-center gap-1 text-forest"><BadgeCheck className="h-4 w-4" />Verified</span>}</p>
          {p.bio && <p className="mt-2 max-w-2xl whitespace-pre-line text-sm text-charcoal">{p.bio}</p>}
        </div>
      </div>
      <h2 className="mb-4 font-heading text-lg font-semibold text-charcoal">Listings</h2>
      <AgentListings ownerId={p.id} />
    </ContentPage>
  );
}
