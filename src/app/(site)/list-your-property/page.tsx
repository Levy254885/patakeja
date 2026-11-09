import { BadgeCheck, Camera, Rocket, Users } from "lucide-react";
import { getPricingServer } from "@/lib/server/firestore-rest";
import { effectivePrice, mergePricing } from "@/lib/pricing";
import { formatKES } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { LinkButton } from "@/components/ui/Button";

export const revalidate = 300;
export const metadata = pageMeta("List your property", "Reach tenants and buyers across Kenya. List rentals, homes for sale, commercial space and land on PataKeja.", "/list-your-property");

export default async function ListPage() {
  const pr = mergePricing(await getPricingServer());
  const reg = effectivePrice(pr.landlordRegistration);
  const boost = effectivePrice(pr.boost);
  const items = [
    { icon: Camera, t: "Photo-first listings", d: "Upload as many photos as you need, choose the cover, and reorder them." },
    { icon: Users, t: "Serious enquiries", d: "Tenants pay to unlock your contact, so the people who call are committed." },
    { icon: BadgeCheck, t: "Get verified", d: "Submit your documents for a Verified badge that builds trust." },
    { icon: Rocket, t: "Boost when you need to", d: `Put a listing at the top of results for ${pr.boost.durationHours} hours.` },
  ];
  return (
    <>
      <section className="bg-forest"><div className="container-page py-12 sm:py-16"><h1 className="max-w-2xl font-heading text-3xl font-extrabold text-white sm:text-4xl">List your property on PataKeja</h1><p className="mt-3 max-w-xl text-white/80">Reach tenants and buyers in all 47 counties. Create your account, add your property and publish.</p><div className="mt-6 flex gap-2"><LinkButton href="/register?role=landlord" variant="gold">I am a landlord</LinkButton><LinkButton href="/register?role=agent" variant="secondary">I am an agent</LinkButton></div></div></section>
      <section className="container-page grid gap-4 py-12 sm:grid-cols-2 lg:grid-cols-4">{items.map((i) => <div key={i.t} className="rounded border border-line bg-white p-5"><i.icon className="h-6 w-6 text-forest" /><h2 className="mt-3 font-heading text-base font-semibold">{i.t}</h2><p className="mt-1 text-sm text-muted">{i.d}</p></div>)}</section>
      <section className="container-page pb-4"><div className="rounded border border-line bg-white p-6"><h2 className="font-heading text-lg font-semibold">Fees</h2><ul className="mt-3 space-y-1.5 text-sm"><li>Landlord/agent registration: <strong>{pr.landlordRegistration.enabled ? formatKES(reg) : "free"}</strong></li><li>Boost a listing: <strong>{pr.boost.enabled ? `${formatKES(boost)} for ${pr.boost.durationHours} hours` : "currently unavailable"}</strong></li><li>Listing drafts are free to create.</li></ul><p className="mt-3 text-xs text-muted">Fees are set by PataKeja and charged by M-Pesa. These figures come from the live pricing settings.</p></div></section>
    </>
  );
}
