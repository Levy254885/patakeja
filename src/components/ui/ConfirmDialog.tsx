"use client";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props { open: boolean; title: string; message: React.ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => Promise<void> | void; onClose: () => void }

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { await onConfirm(); onClose(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" sheet={false}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button variant={danger ? "danger" : "primary"} loading={busy} onClick={run}>{confirmLabel}</Button></>}>
      <div className="text-sm text-charcoal">{message}</div>
    </Modal>
  );
}
