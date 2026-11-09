import Link from "next/link";
import { Logo } from "./Logo";
import { COUNTIES } from "@/lib/locations/kenya";
import { slugify } from "@/lib/format";

const cols = [
  { title: "Explore", links: [["Rent", "/rent"], ["Buy", "/sale"], ["Commercial", "/commercial"], ["Land", "/land"], ["Browse locations", "/locations"]] },
  { title: "Landlords & agents", links: [["List your property", "/list-your-property"], ["Agent directory", "/agents"], ["Landlord login", "/login"]] },
  { title: "Company", links: [["About", "/about"], ["Contact", "/contact"], ["Help centre", "/help"], ["FAQ", "/faq"]] },
  { title: "Legal", links: [["Privacy policy", "/privacy"], ["Terms of use", "/terms"]] },
];

export function SiteFooter() {
  const popular = ["047", "001", "042", "022", "032", "016"].map((c) => COUNTIES.find((x) => x.code === c)).filter(Boolean) as typeof COUNTIES;
  return (
    <footer className="mt-16 bg-forest text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-3 text-sm text-white/70">Find your place. Make your move.</p>
          <p className="mt-4 text-xs text-white/60">Kenya-wide homes, commercial space and land. Pay only to reach the landlord you want.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="font-heading text-sm font-semibold text-gold">{c.title}</h3>
            <ul className="mt-3 space-y-2 text-sm">{c.links.map(([l, h]) => <li key={h}><Link href={h} className="text-white/80 hover:text-white">{l}</Link></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 text-xs text-white/60 sm:px-6">
          <span>Popular:</span>{popular.map((c) => <Link key={c.code} href={`/locations/${slugify(c.name)}`} className="hover:text-white">{c.name}</Link>)}
          <span className="ml-auto">© {new Date().getFullYear()} PataKeja · www.patakeja.co.ke</span>
        </div>
      </div>
    </footer>
  );
}
