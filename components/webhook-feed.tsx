"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWebhooks, postFlush } from "@/lib/api-client";
import type { WebhookRecord } from "@/lib/types";
import { isSocketsEnabled } from "@/lib/public-config";
import { apiErrorMessage } from "@/lib/api-error";
import { stringifyWebhookPayload } from "@/lib/webhook-json";
import { useWebhookSocket } from "@/hooks/use-webhook-socket";
import { useToast } from "@/components/toast-provider";
import { ConnectionPill } from "./connection-pill";
import { WebhookSidePanel } from "./webhook-side-panel";
import { ConfirmDialog } from "./confirm-dialog";

function previewPayload(data: unknown): string {
  if (data === null || data === undefined) return "";
  if (typeof data === "string") return data.slice(0, 160);
  try {
    return JSON.stringify(data).slice(0, 200);
  } catch {
    return String(data);
  }
}

export function WebhookFeed() {
  const { showToast } = useToast();
  const socketsOn = isSocketsEnabled();
  const [records, setRecords] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketOk, setSocketOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [panelRecord, setPanelRecord] = useState<WebhookRecord | null>(null);
  const [flushDialogOpen, setFlushDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const env = await fetchWebhooks();
      if (env.status !== 200) {
        showToast(
          apiErrorMessage(env.status, env.data, `Could not load webhooks (${env.status})`),
          "error"
        );
        return;
      }
      setRecords(env.data.records);
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useWebhookSocket(
    socketsOn,
    (record) => {
      setRecords((prev) => {
        if (prev.some((p) => p.id === record.id)) return prev;
        return [record, ...prev];
      });
    },
    setSocketOk
  );

  async function doFlush() {
    setBusy(true);
    try {
      const env = await postFlush();
      if (env.status !== 200) {
        showToast(
          apiErrorMessage(env.status, env.data, "Could not clear list"),
          "error"
        );
        return;
      }
      setRecords([]);
      setPanelRecord(null);
      setFlushDialogOpen(false);
      showToast("List cleared", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setBusy(false);
    }
  }

  async function copyRecordPayload(r: WebhookRecord, e: React.MouseEvent) {
    e.stopPropagation();
    const text = stringifyWebhookPayload(r.webhookData);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard", "success");
    } catch {
      showToast("Could not copy", "error");
    }
  }

  return (
    <>
      <ConfirmDialog
        open={flushDialogOpen}
        onClose={() => !busy && setFlushDialogOpen(false)}
        title="Clear list?"
        description="Clears the list below. Saved backup files are not removed."
        cancelLabel="Cancel"
        confirmLabel="Clear list"
        variant="danger"
        busy={busy}
        onConfirm={doFlush}
      />

      <WebhookSidePanel
        record={panelRecord}
        onClose={() => setPanelRecord(null)}
      />

      <div className="toolbar">
        <div className="toolbar__start">
          {socketsOn ? (
            <ConnectionPill mode="socket" connected={socketOk} />
          ) : (
            <ConnectionPill mode="http-only" />
          )}
        </div>
        <div className="toolbar__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void load()}
            disabled={loading}
          >
            Reload
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setFlushDialogOpen(true)}
            disabled={busy || loading}
          >
            Clear list
          </button>
        </div>
      </div>

      {loading ? (
        <p className="page-lede" style={{ marginTop: 0 }}>
          Loading captured webhooks…
        </p>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <p style={{ margin: 0 }}>No payloads yet.</p>
        </div>
      ) : (
        <div className="card-list">
          {records.map((r) => (
            <article key={r.id} className="card">
              <div className="card__row">
                <button
                  type="button"
                  className="card__expand"
                  onClick={() => setPanelRecord(r)}
                  aria-label="Open payload details"
                >
                  <div className="card__meta">
                    <p className="card__meta-line">
                      <span className="card__meta-k">Webhook ID:</span>{" "}
                      <code className="field-value__id">{r.id}</code>
                    </p>
                    <p className="card__meta-line">
                      <span className="card__meta-k">Created at:</span>{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="card__preview">{previewPayload(r.webhookData)}</div>
                </button>
                <button
                  type="button"
                  className="btn btn--primary btn--compact"
                  onClick={(e) => void copyRecordPayload(r, e)}
                  aria-label="Copy JSON payload to clipboard"
                >
                  Copy
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
