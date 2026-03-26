"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchWebhooks, postFlush } from "@/lib/api-client";
import type { WebhookRecord } from "@/lib/types";
import { isSocketsEnabled } from "@/lib/public-config";
import { useWebhookSocket } from "@/hooks/use-webhook-socket";
import { ConnectionPill } from "./connection-pill";

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
  const socketsOn = isSocketsEnabled();
  const [records, setRecords] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketOk, setSocketOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const env = await fetchWebhooks();
      if (env.status !== 200) {
        setError(
          typeof env.data === "object" && env.data && "message" in env.data
            ? String((env.data as { message: string }).message)
            : `HTTP ${env.status}`
        );
        return;
      }
      setRecords(env.data.records);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function onFlush() {
    if (!confirm("Clear all captured webhooks from memory?")) return;
    setBusy(true);
    setError(null);
    try {
      const env = await postFlush();
      if (env.status !== 200) {
        setError("Could not flush store");
        return;
      }
      setRecords([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="toolbar">
        {socketsOn ? (
          <ConnectionPill mode="socket" connected={socketOk} />
        ) : (
          <ConnectionPill mode="http-only" />
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void load()}
          disabled={loading}
        >
          {socketsOn ? "Refresh from API" : "Refresh (GET /webhook)"}
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => void onFlush()}
          disabled={busy || loading}
        >
          Clear memory
        </button>
      </div>

      {!socketsOn ? (
        <p className="config-hint" role="status">
          Live sockets are off (<code>NEXT_PUBLIC_IS_SOCKETS_ENABLED=false</code>
          ). Use <strong>Refresh</strong> to reload the list after new POSTs.
        </p>
      ) : null}

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <p className="page-lede" style={{ marginTop: 0 }}>
          Loading captured webhooks…
        </p>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <p style={{ margin: "0 0 0.5rem" }}>No webhooks yet.</p>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            POST JSON to your backend <code>/webhook</code>
            {socketsOn
              ? " — new events appear here via Socket.IO."
              : " — then press Refresh to see them here."}
          </p>
        </div>
      ) : (
        <div className="card-list">
          {records.map((r) => (
            <article key={r.id} className="card">
              <div className="card__meta">
                <span>
                  <Link href={`/webhooks/${encodeURIComponent(r.id)}`}>
                    View detail
                  </Link>
                </span>
                <span>
                  <code>{r.id}</code>
                </span>
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="card__preview">{previewPayload(r.webhookData)}</div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
