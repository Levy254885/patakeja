import { pageMeta, TAGLINE } from "@/lib/seo";
import { ContentPage, prose } from "@/components/content/ContentPage";
import { LinkButton } from "@/components/ui/Button";

export const metadata = pageMeta("About PataKeja", "PataKeja is a Kenyan property marketplace connecting tenants and buyers with verified landlords and agents.", "/about");

export default function AboutPage() {
  return (
    <ContentPage title="About PataKeja" intro={TAGLINE}>
      <div className={prose}>
        <p>PataKeja is a Kenyan property marketplace for homes, commercial space and land. We help people find a place to rent or buy, and help landlords and agents reach them.</p>
        <h2>How it works</h2>
        <ul>
          <li>Search free by county, area, price and property type.</li>
          <li>Landlords and agents register and list properties; our team reviews listings before they go live.</li>
          <li>Tenants pay a small one-time M-Pesa fee to unlock a landlord's contact for a property they are serious about.</li>
        </ul>
        <h2>Trust and safety</h2>
        <p>Verified badges show listers whose identity our team has checked. We still advise you to view a property in person and never to pay before you have seen it. You can report any listing that looks wrong.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/search">Browse properties</LinkButton>
        <LinkButton href="/list-your-property" variant="outline">List your property</LinkButton>
      </div>
    </ContentPage>
  );
}
