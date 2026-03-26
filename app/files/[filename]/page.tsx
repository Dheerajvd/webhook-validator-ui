"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchBackupFile } from "@/lib/api-client";
import type { WebhookRecord } from "@/lib/types";
import { JsonPanel } from "@/components/json-panel";

export default function BackupFileDetailPage() {
  const params = useParams();
  const filename =
    typeof params.filename === "string"
      ? decodeURIComponent(params.filename)
      : "";
  const [records, setRecords] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filename) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const env = await fetchBackupFile(filename);
        if (cancelled) return;
        if (env.status !== 200) {
          setError(
            typeof env.data === "object" && env.data && "message" in env.data
              ? String((env.data as { message: string }).message)
              : `Error ${env.status}`
          );
          setRecords([]);
          return;
        }
        if ("records" in env.data) {
          setRecords(env.data.records);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filename]);

  return (
    <>
      <p style={{ margin: "0 0 1rem" }}>
        <Link href="/files">← Back to backups</Link>
      </p>
      <h1 className="page-title">Backup file</h1>
      <p className="page-lede">
        <code>{filename}</code> — loaded with <code>GET /files/:filename</code>
      </p>

      {loading ? (
        <p className="page-lede">Loading…</p>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : (
        <>
          <p style={{ color: "var(--muted)", marginTop: 0 }}>
            {records.length} record(s)
          </p>
          <JsonPanel value={records} />
        </>
      )}
    </>
  );
}
