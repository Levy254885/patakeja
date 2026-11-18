"use client";
import { Rocket } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { DataTable, PageHeader } from "@/components/ui/Misc";
import { AsyncView } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { listBoosts, propertyTitles } from "@/lib/services/admin";
import { formatDateTime, formatKES } from "@/lib/format";

export default function AdminBoostsPage() {
  const state = useAsync(async () => {
    const rows = await listBoosts(300);
    return { rows, titles: await propertyTitles(rows.map((r) => r.propertyId)) };
  }, []);
  return (
    <div className="space-y-4">
      <PageHeader title="Boosts" description="Paid boost campaigns (created by the payment callback)." />
      <AsyncView state={state}>
        {({ rows, titles }) => (
          <DataTable rows={rows} rowKey={(b) => b.id} empty={<EmptyState icon={Rocket} title="No boosts yet" message="Boosts appear after a landlord pays to promote a listing." />}
            columns={[
              { key: "p", header: "Property", render: (b) => titles[b.propertyId] || b.propertyId },
              { key: "a", header: "Amount", render: (b) => formatKES(b.amount) },
              { key: "s", header: "Starts", render: (b) => formatDateTime(b.startsAt ?? b.createdAt) },
              { key: "e", header: "Ends", render: (b) => formatDateTime(b.endsAt) },
              { key: "st", header: "State", render: (b) => (b.endsAt > Date.now() ? <Badge tone="green">Active</Badge> : <Badge>Ended</Badge>) },
            ]} />
        )}
      </AsyncView>
    </div>
  );
}
