"use client";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Card, PageHeader } from "@/components/ui/Misc";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Loadable } from "@/components/portal/common";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createVerificationRequest, getMyVerificationRequests } from "@/lib/services/verification";
import { formatDate } from "@/lib/format";
import type { CloudImage } from "@/lib/types";

export default function VerificationPage() {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? "";
  const toast = useToast();
  const reqs = useAsync(() => getMyVerificationRequests(uid), [uid], !!uid);
  const [docs, setDocs] = useState<CloudImage[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const status = profile?.verification ?? "none";
  const pending = reqs.data?.some((r) => r.status === "pending");

  const upload = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    try { const up = await Promise.all(Array.from(files).map((f) => uploadToCloudinary(f, { kind: "document" }))); setDocs((d) => [...d, ...up]); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); if (file.current) file.current.value = ""; }
  };
  const submit = async () => {
    if (!profile) return;
    if (!docs.length) return setError("Upload at least one document, such as your ID or title deed.");
    setError(""); setBusy(true);
    try {
      await createVerificationRequest({ userId: profile.uid, userName: profile.fullName, kind: profile.role === "agent" ? "agent" : "landlord", note: note.trim() || undefined, documents: docs });
      toast.success("Verification request sent."); setDocs([]); setNote(""); reqs.reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not send the request."); }
    finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Verification" description="Verified listers get a badge that builds trust with tenants." action={<StatusBadge status={status} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Request verification">
          {status === "verified" ? <p className="text-sm text-muted">Your account is verified.</p> : pending ? <p className="text-sm text-muted">Your request is being reviewed. We will notify you of the outcome.</p> : (
            <div className="space-y-4">
              <p className="text-sm text-muted">Upload a national ID or passport, plus a title deed, lease or agency licence.</p>
              <input ref={file} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => upload(e.target.files)} />
              <Button variant="secondary" loading={busy} onClick={() => file.current?.click()}><Upload className="h-4 w-4" /> Add documents</Button>
              {docs.length > 0 && <ul className="space-y-1 text-sm">{docs.map((d) => <li key={d.publicId} className="flex justify-between"><span className="truncate">{d.publicId.split("/").pop()}</span>
                <button className="text-danger" onClick={() => setDocs(docs.filter((x) => x.publicId !== d.publicId))}>Remove</button></li>)}</ul>}
              {error && <p className="text-xs text-danger" role="alert">{error}</p>}
              <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
              <Button loading={busy} onClick={submit}>Send for review</Button>
            </div>
          )}
        </Card>
        <Card title="Your requests">
          <Loadable state={reqs}>
            {(rows) => !rows.length ? <p className="text-sm text-muted">No requests yet.</p> : (
              <ul className="divide-y divide-line text-sm">{rows.map((r) => (
                <li key={r.id} className="py-2.5"><div className="flex justify-between"><span>{formatDate(r.createdAt)}</span><StatusBadge status={r.status} /></div>
                  {r.reviewNote && <p className="mt-1 text-xs text-muted">{r.reviewNote}</p>}</li>))}</ul>
            )}
          </Loadable>
        </Card>
      </div>
    </>
  );
}
