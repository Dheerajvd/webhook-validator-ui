"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { fetchWebhook } from "@/lib/api-client";
import type { WebhookRecord } from "@/lib/types";
import { apiErrorMessage } from "@/lib/api-error";
import { isSocketsEnabled } from "@/lib/public-config";
import { useWebhookSocket } from "@/hooks/use-webhook-socket";
import { useToast } from "@/components/toast-provider";
import { JsonPanel } from "@/components/json-panel";
import { ConnectionPill } from "@/components/connection-pill";

export default function WebhookDetailPage() {
  const { showToast } = useToast();
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
        const msg = apiErrorMessage(env.status, env.data, "Not found");
        setError(msg);
        showToast(msg, "error");
        setRecord(null);
        return;
      }
      if (env.status === 200 && "record" in env.data) {
        setRecord(env.data.record);
        return;
      }
      const msg = apiErrorMessage(env.status, env.data, "Unexpected response");
      setError(msg);
      showToast(msg, "error");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

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
        <div className="toolbar__start">
          {socketsOn ? (
            <ConnectionPill mode="socket" connected={socketOk} />
          ) : (
            <ConnectionPill mode="http-only" />
          )}
        </div>
        {!socketsOn ? (
          <div className="toolbar__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void load()}
              disabled={loading}
            >
              Reload
            </button>
          </div>
        ) : null}
      </div>
      <h1 className="page-title">Webhook</h1>
      {loading ? (
        <p className="page-lede">Loading…</p>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : record ? (
        <>
          <dl className="field-list" style={{ marginBottom: "1rem" }}>
            <div className="field-row">
              <dt className="field-label">Webhook ID</dt>
              <dd className="field-value">
                <code>{record.id}</code>
              </dd>
            </div>
            <div className="field-row">
              <dt className="field-label">Created at</dt>
              <dd className="field-value">
                {new Date(record.createdAt).toLocaleString()}
              </dd>
            </div>
          </dl>
          <p className="field-label" style={{ marginBottom: "0.35rem" }}>
            Payload
          </p>
          <JsonPanel value={record.webhookData} />
        </>
      ) : null}
    </>
  );
}
