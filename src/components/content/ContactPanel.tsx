"use client";
import Link from "next/link";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthProvider";
import { Card } from "@/components/ui/Misc";
import { LinkButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { getGeneralSettings } from "@/lib/services/catalog";
import { whatsappLink } from "@/lib/format";

export function ContactPanel({ icons }: { icons: { mail: React.ReactNode; phone: React.ReactNode; chat: React.ReactNode } }) {
  const { user } = useAuth();
  const s = useAsync(() => getGeneralSettings(), []);
  const g = s.data;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card title="Reach us">
        {!g ? <Skeleton className="h-20 w-full" /> : (
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">{icons.mail}<a className="text-forest hover:underline" href={`mailto:${g.supportEmail}`}>{g.supportEmail}</a></li>
            {g.supportPhone && <li className="flex items-center gap-2">{icons.phone}<a className="text-forest hover:underline" href={`tel:${g.supportPhone}`}>{g.supportPhone}</a></li>}
            {g.whatsapp && whatsappLink(g.whatsapp) && <li className="flex items-center gap-2">{icons.chat}<a className="text-forest hover:underline" href={whatsappLink(g.whatsapp) ?? undefined} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
          </ul>
        )}
      </Card>
      <Card title="Need account or payment help?">
        <p className="text-sm text-muted">Signed-in users can open a support ticket and follow replies in their account.</p>
        <div className="mt-3">
          <LinkButton href={user ? "/account/support" : "/login?next=/account/support"} variant="outline">{user ? "Open a support ticket" : "Sign in to open a ticket"}</LinkButton>
        </div>
        <p className="mt-3 text-xs text-muted">Also see <Link className="text-forest hover:underline" href="/help">Help centre</Link> and <Link className="text-forest hover:underline" href="/faq">FAQs</Link>.</p>
      </Card>
    </div>
  );
}
