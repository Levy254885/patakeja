"use client";
import { useState } from "react";
import { KeyRound, MessageCircle, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { Button, LinkButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Loadable, PropertyMini } from "@/components/account/parts";
import { getMyUnlocks, getPrivateContact } from "@/lib/services/payments";
import { fetchPropertiesByIds } from "@/lib/services/properties";
import { formatDate, whatsappLink } from "@/lib/format";
import type { ContactUnlock, Property, PropertyContact } from "@/lib/types";

async function load(uid: string) {
  const unlocks = await getMyUnlocks(uid);
  const props = await fetchPropertiesByIds(unlocks.map((u) => u.propertyId), 100);
  return { unlocks, byId: new Map<string, Property>(props.map((p) => [p.id, p])) };
}

function UnlockRow({ unlock, property }: { unlock: ContactUnlock; property?: Property }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [contact, setContact] = useState<PropertyContact | null>(null);
  const reveal = async () => {
    setBusy(true);
    const c = await getPrivateContact(unlock.propertyId);
    setBusy(false);
    if (c) setContact(c);
    else toast.error("Contact details are not available right now. The listing may have been removed. Contact support if this persists.");
  };
  const wa = contact ? whatsappLink(contact.whatsapp || contact.phone) : null;
  return (
    <li className="rounded border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PropertyMini property={property} propertyId={unlock.propertyId} />
        {!contact && <Button size="sm" variant="outline" loading={busy} onClick={reveal}>Show contact</Button>}
      </div>
      <p className="mt-2 text-xs text-muted">Unlocked {formatDate(unlock.createdAt)}</p>
      {contact && (
        <div className="mt-3 rounded border border-line bg-ivory p-3 text-sm">
          <p className="font-medium text-charcoal">{contact.contactName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-2 text-charcoal hover:border-forest"><Phone className="h-4 w-4 text-forest" />{contact.phone}</a>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded border border-line bg-white px-3 py-2 text-charcoal hover:border-forest"><MessageCircle className="h-4 w-4 text-forest" />WhatsApp</a>}
          </div>
          {contact.altPhone && <p className="mt-2 text-muted">Alternative: {contact.altPhone}</p>}
          {contact.email && <p className="mt-1 text-muted">Email: <a className="text-forest hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a></p>}
        </div>
      )}
    </li>
  );
}

export default function UnlockedPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => load(uid), [uid], !!uid);
  return (
    <>
      <PageHeader title="Unlocked contacts" description="Landlord contacts you have paid to access. Once unlocked, a contact stays available to you." />
      <Loadable state={s}>
        {({ unlocks, byId }) => unlocks.length ? (
          <ul className="space-y-3">{unlocks.map((u) => <UnlockRow key={u.id} unlock={u} property={byId.get(u.propertyId)} />)}</ul>
        ) : (
          <EmptyState icon={KeyRound} title="No unlocked contacts" message="Open a listing and choose to contact the landlord. You pay once per property, by M-Pesa." action={<LinkButton href="/search">Find a place</LinkButton>} />
        )}
      </Loadable>
    </>
  );
}
