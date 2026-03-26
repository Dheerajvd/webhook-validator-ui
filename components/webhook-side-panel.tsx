"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { WebhookRecord } from "@/lib/types";
import { stringifyWebhookPayload } from "@/lib/webhook-json";
import { useToast } from "@/components/toast-provider";
import { JsonPanel } from "./json-panel";

type Props = {
  record: WebhookRecord | null;
  onClose: () => void;
};

export function WebhookSidePanel({ record, onClose }: Props) {
  const { showToast } = useToast();

  useEffect(() => {
    if (!record) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [record, onClose]);

  if (!record) return null;

  const jsonText = stringifyWebhookPayload(record.webhookData);

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(jsonText);
      showToast("Copied to clipboard", "success");
    } catch {
      showToast("Could not copy", "error");
    }
  }

  return (
    <div className="side-panel-root" role="presentation">
      <button
        type="button"
        className="side-panel-backdrop"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside className="side-panel" aria-labelledby="side-panel-title">
        <header className="side-panel__header">
          <div className="side-panel__header-top">
            <h2 id="side-panel-title" className="side-panel__title">
              Webhook payload
            </h2>
            <div className="side-panel__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void copyPayload()}
              >
                Copy JSON
              </button>
              <Link
                href={`/webhooks/${encodeURIComponent(record.id)}`}
                className="btn"
              >
                Full page
              </Link>
              <button type="button" className="btn" onClick={onClose}>
                Close
              </button>
            </div>
          </div>

          <div className="side-panel__meta">
            <h3 className="side-panel__meta-heading">Details</h3>
            <dl className="field-list field-list--panel">
              <div className="field-row field-row--panel">
                <dt className="field-label">Webhook ID</dt>
                <dd className="field-value">
                  <code className="field-value__mono">{record.id}</code>
                </dd>
              </div>
              <div className="field-row field-row--panel">
                <dt className="field-label">Created at</dt>
                <dd className="field-value">
                  {new Date(record.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="side-panel__body" aria-labelledby="side-panel-payload-heading">
          <h3 id="side-panel-payload-heading" className="side-panel__section-title">
            Payload
          </h3>
          <div className="side-panel__json-shell">
            <JsonPanel value={record.webhookData} />
          </div>
        </section>
      </aside>
    </div>
  );
}
