"use client";
import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader, Card } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { broadcastNotification, type BroadcastAudience } from "@/lib/services/admin";
import { errMsg } from "@/components/admin/common";

const AUDIENCES: { value: BroadcastAudience; label: string }[] = [
  { value: "all", label: "Everyone" }, { value: "customer", label: "Customers" }, { value: "landlord", label: "Landlords" }, { value: "agent", label: "Agents" },
];

export default function AdminBroadcastPage() {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [confirm, setConfirm] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (title.trim().length < 3) e.title = "Enter a title (at least 3 characters)";
    if (body.trim().length < 5) e.body = "Enter a message (at least 5 characters)";
    setErrors(e);
    if (!Object.keys(e).length) setConfirm(true);
  };
  const label = AUDIENCES.find((a) => a.value === audience)?.label.toLowerCase();

  return (
    <div className="space-y-4">
      <PageHeader title="Broadcast" description="Send an in-app notification to a group of users. Broadcasts cannot be recalled." />
      <Card className="max-w-2xl space-y-4 p-5">
        <Select label="Audience" options={AUDIENCES} value={audience} onChange={(e) => setAudience(e.target.value as BroadcastAudience)} />
        <Input label="Title" maxLength={80} value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Message" rows={5} maxLength={500} value={body} error={errors.body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex items-center gap-3">
          <Button onClick={validate}><Megaphone className="h-4 w-4" />Send broadcast</Button>
          {last && <span className="text-sm text-muted">{last}</span>}
        </div>
      </Card>
      <ConfirmDialog open={confirm} title="Send broadcast?" message={`This will notify ${label}. It cannot be undone.`} confirmLabel="Send" onClose={() => setConfirm(false)}
        onConfirm={async () => {
          try {
            const r = await broadcastNotification({ title: title.trim(), body: body.trim(), audience });
            toast.success("Broadcast sent");
            setLast(r.sent !== undefined ? `Last broadcast reached ${r.sent} users.` : "Last broadcast sent.");
            setTitle(""); setBody("");
          } catch (e) { toast.error(errMsg(e)); }
        }} />
    </div>
  );
}
