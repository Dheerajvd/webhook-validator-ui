"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { fetchWebhook } from "@/lib/api-client";
import type { WebhookRecord } from "@/lib/types";
import { isSocketsEnabled } from "@/lib/public-config";
import { useWebhookSocket } from "@/hooks/use-webhook-socket";
import { JsonPanel } from "@/components/json-panel";
import { ConnectionPill } from "@/components/connection-pill";

export default function WebhookDetailPage() {
  const socketsOn = isSocketsEnabled();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [record, setRecord] = useState<WebhookRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketOk, setSocketOk] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const env = await fetchWebhook(id);
      if (env.status === 404 || env.status === 400) {
        setError(
          typeof env.data === "object" && env.data && "message" in env.data
            ? String((env.data as { message: string }).message)
            : "Not found"
        );
        setRecord(null);
        return;
      }
      if (env.status === 200 && "record" in env.data) {
        setRecord(env.data.record);
        return;
      }
      setError("Unexpected response");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useWebhookSocket(
    socketsOn,
    (incoming) => {
      if (incoming.id === id) setRecord(incoming);
    },
    setSocketOk
  );

  return (
    <>
      <p style={{ margin: "0 0 1rem" }}>
        <Link href="/">← Back to live feed</Link>
      </p>
      <div className="toolbar" style={{ marginBottom: "0.75rem" }}>
        {socketsOn ? (
          <ConnectionPill mode="socket" connected={socketOk} />
        ) : (
          <ConnectionPill mode="http-only" />
        )}
        <span className="badge">GET /webhook/:id on load</span>
        {!socketsOn ? (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void load()}
            disabled={loading}
          >
            Refresh (GET)
          </button>
        ) : null}
      </div>
      <h1 className="page-title">Webhook</h1>
      {loading ? (
        <p className="page-lede">Loading…</p>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : record ? (
        <>
          <p className="page-lede" style={{ marginBottom: "1rem" }}>
            <code>{record.id}</code> · {new Date(record.createdAt).toLocaleString()}
          </p>
          <JsonPanel value={record.webhookData} />
        </>
      ) : null}
    </>
  );
}
